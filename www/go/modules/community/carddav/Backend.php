<?php
namespace go\modules\community\carddav;

use Exception;
use go\core\acl\model\Acl;
use go\core\ErrorHandler;
use go\modules\community\addressbook\convert\VCard;
use go\modules\community\addressbook\model\AddressBook;
use go\modules\community\addressbook\model\Contact;
use go\modules\community\addressbook\model\VCard as VCardModel;
use Sabre\CardDAV\Backend\AbstractBackend;
use Sabre\CardDAV\Plugin;
use Sabre\CardDAV\Xml\Property\SupportedAddressData;
use Sabre\DAV\Exception\Forbidden;
use Sabre\DAV\Exception\NotFound;
use Sabre\DAV\PropPatch;
use Sabre\VObject\Reader;
use function GO;

class Backend extends AbstractBackend {
	
	public function createAddressBook($principalUri, $url, array $properties): void {
		
	}

	public function createCard($addressBookId, $cardUri, $cardData) {
		$addressbook = AddressBook::findById($addressBookId);
		if(!$addressbook) {
			throw new NotFound();
		}
		
		if(!$addressbook->getPermissionLevel()) {
			throw new Forbidden();
		}
		
		$vcardComp = Reader::read($cardData, Reader::OPTION_FORGIVING + Reader::OPTION_IGNORE_INVALID_LINES);
		
		$contact = new Contact();
		$contact->addressBookId = $addressBookId;
		$contact->uid = (string) $vcardComp->uid;
		$contact->uri = $cardUri;
		
		$this->createBlob($contact, $cardData);
		
		$c = new VCard();
		$c->import($vcardComp, $contact);
		
		//blob id can serve as ETag
		return $contact->vcardBlobId;		
	}

	public function deleteAddressBook($addressBookId): void {
		
	}
	
	private function createBlob(Contact $contact, $cardData) {
		
		//Important to set exactly the same modifiedAt on both blob and contact. 
		//We compare these to check if vcards need to be updated.
		$contact->modifiedAt = new \go\core\util\DateTime();
		
		$blob = \go\core\fs\Blob::fromString($cardData);
		$blob->type = 'text/vcard';
		$blob->name = $contact->uri;
		$blob->modifiedAt = $contact->modifiedAt;
		if(!$blob->save()) {
			throw new \Exception("could not save vcard blob");
		}
		
		if(isset($contact->vcardBlobId)) {
			$old = \go\core\fs\Blob::findById($contact->vcardBlobId);
			$old->delete();
		}
		
		$contact->vcardBlobId = $blob->id;
		
		return $blob;
	}

	public function deleteCard($addressBookId, $cardUri): bool {		
		$contact = Contact::find(['id', 'addressBookId'])->where(['addressBookId' => $addressBookId, 'uri' => $cardUri])->single();
		if(!$contact) {
			throw new NotFound();
		}
		if($contact->getPermissionLevel() < Acl::LEVEL_DELETE) {
			throw new Forbidden();
		}
		return $contact->delete();
	}
	
	private function addressBookToDAV(AddressBook $addressBook, $principalUri) {
		return array(
			'id' => $addressBook->id,
			'uri' => $addressBook->id,
			'principaluri' => $principalUri,
			'{DAV:}displayname' => $addressBook->name,
			'{http://calendarserver.org/ns/}getctag' => Contact::getState(),
			'{' . Plugin::NS_CARDDAV . '}supported-address-data' => new SupportedAddressData(['contentType' => 'text/vcard', 'version' => '3.0']),
			'{' . Plugin::NS_CARDDAV . '}addressbook-description' => 'User addressbook'
		);
	}

	public function getAddressBooksForUser($principalUri): array {
		
		$r = [];
		$addressBooks = AddressBook::find()
						->filter(['permissionLevel' => Acl::LEVEL_READ]);
						
		foreach($addressBooks as $a) {
			$r[] = $this->addressBookToDAV($a, $principalUri);
		}
		
		return $r;						
	}

	public function getCard($addressBookId, $cardUri): array {
		
		$addressbook = AddressBook::findById($addressBookId);
		if(!$addressbook) {
			throw new NotFound();
		}
		
		if(!$addressbook->getPermissionLevel()) {
			throw new Forbidden();
		}
		
		$contact = Contact::find()->where(['addressBookId' => $addressBookId, 'uri' => $cardUri])->single();
		if(!$contact) {
			throw new NotFound();
		}
		
		
		$blob = \go\core\fs\Blob::findById($contact->vcardBlobId);
		
		if($blob->modifiedAt < $contact->modifiedAt) {
			//blob won't be deleted if still used
			$blob->delete();
			$c = new VCard();
			$cardData = $c->export($contact);			
			$blob = $this->createBlob($contact, $cardData);
			$contact->save();
		}
		
		return [
					'carddata' => $blob->getFile()->getContents(),
					'uri' => $contact->uri,
					'lastmodified' => $contact->modifiedAt->format("U"),
					'etag' => $contact->vcardBlobId,
					'size' => $blob->size
			];
	}	
	
	private function generateCards($addressbookId) {
		$contacts = Contact::find()
						->join('core_blob', 'b', 'b.id = c.vcardBlobId', 'LEFT')
						->where(['addressBookId' => $addressbookId])
						->andWhere('c.vcardBlobId IS NULL OR b.modifiedAt < c.modifiedAt')
						->execute();
		
		if(!$contacts->rowCount()) {
			return;
		}
		
		$c = new VCard();
		
		foreach($contacts as $contact) {
			$cardData = $c->export($contact);
			
			$blob = $this->createBlob($contact, $cardData);
			
			if(!$contact->save()) {
				$blob->delete();
				throw new \Exception("Could not save contact");
			}
		}
	}

	public function getCards($addressbookId): array {
		$addressbook = AddressBook::findById($addressbookId);
		if(!$addressbook) {
			throw new NotFound();
		}
		
		if(!$addressbook->getPermissionLevel()) {
			throw new Forbidden();
		}
		
		$this->generateCards($addressbookId);		
		
		return GO()->getDbConnection()->select('c.uri, UNIX_TIMESTAMP(c.modifiedAt) as lastmodified, vcardBlobId AS etag, b.size')
						->from('addressbook_contact', 'c')
						->join('core_blob', 'b', 'c.vcardBlobId = b.id')
						->where('c.addressBookId', '=', $addressbookId)->all();
	}
	

	public function updateAddressBook($addressBookId, PropPatch $propPatch): void {
		
	}

	public function updateCard($addressBookId, $cardUri, $cardData) {
		
		$contact = Contact::find()->where(['addressBookId' => $addressBookId, 'uri' => $cardUri])->single();
		if(!$contact) {
			throw new NotFound();
		}
		if($contact->getPermissionLevel() < Acl::LEVEL_DELETE) {
			throw new Forbidden();
		}
		
		$blob = $this->createBlob($contact, $cardData);	
		
		try {
			GO()->debug($cardData);
			$c = new VCard();			
			$vcardComponent = Reader::read($cardData, Reader::OPTION_FORGIVING + Reader::OPTION_IGNORE_INVALID_LINES);
			$c->import($vcardComponent, $contact);
			
		} catch(Exception $e) {
			ErrorHandler::logException($e);		
			
			$blob->delete();			
			
			return false;
		}
		//vcardBlobId can serve as etag
		return $contact->vcardBlobId;						
	}
}
