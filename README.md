# 📂 Salesforce ↔ Google Drive File Integration
## 🚀 Overview

This project integrates **Salesforce** with **Google Drive** to automatically upload files to Drive whenever a user uploads a file in Salesforce.  

It also stores metadata about uploaded files in a custom Salesforce object (`Google_Drive_File__c`) and displays them in a **Lightning Web Component (LWC)** on the related record page.

---

## 🧠 Features

- ✅ Automatically uploads Salesforce files to **Google Drive**  
- ✅ Creates a folder structure in Drive:

```bash
Google Drive
└── Object Name (e.g. Account)
└── Record ID (e.g. 001xxxx)
└── Uploaded File (MyFile.pdf)
```

- ✅ Stores Google Drive file details in a custom Salesforce object  
- ✅ Displays linked files in a record page using an **LWC Datatable**  
- ✅ Allows freeing up Salesforce storage by deleting local files (while retaining Drive links)

---

## 🧩 Components

### 1. **Apex Trigger:** `ContentVersionTrigger`
Listens to file uploads (`ContentVersion` insert events) and calls the handler asynchronously.

```apex
trigger ContentVersionTrigger on ContentVersion (after insert) {
  Set<Id> contentDocIds = new Set<Id>();
  for (ContentVersion cv : Trigger.new) {
      contentDocIds.add(cv.ContentDocumentId);
  }

  Map<Id, Id> versionToRecord = new Map<Id, Id>();
  List<ContentDocumentLink> links = [
      SELECT ContentDocumentId, LinkedEntityId
      FROM ContentDocumentLink
      WHERE ContentDocumentId IN :contentDocIds
  ];

  for (ContentVersion cv : Trigger.new) {
      for (ContentDocumentLink link : links) {
          if (cv.ContentDocumentId == link.ContentDocumentId && !String.valueOf(link.LinkedEntityId).startsWith('005')) {
              versionToRecord.put(cv.Id, link.LinkedEntityId);
          }
      }
  }

  for (Id cvId : versionToRecord.keySet()) {
      ContentVersionTriggerHandler.callGDrive(String.valueOf(cvId), String.valueOf(versionToRecord.get(cvId)));
  }
}

```

### 2. **Apex Class:** `ContentVersionTriggerHandler`
Handles the Google Drive API calls — creates folders, uploads files, and records file metadata in Salesforce.
```apex
public class ContentVersionTriggerHandler {
    @future(callout=true)
    public static void callGDrive(String cvID, String recordId) {
        // 1. Fetch ContentVersion
        // 2. Determine MIME type
        // 3. Create folders (Object + Record)
        // 4. Upload to Google Drive
        // 5. Create Google_Drive_File__c record
    }

    // Helper methods:
    //  - getOrCreateFolder()
    //  - escapeJson()
}

```

### Named Credential Requirements:
- google_drive_named_cred → For Google Drive API requests (folder creation)
- google_drive_namedCred_upload → For file uploads (multipart)

### 3. **Custom Object:** `Google_Drive_File__c`
| Field Label                | API Name                  | Type            | Description                          |
| -------------------------- | ------------------------- | --------------- | ------------------------------------ |
| **Google Drive File Name** | `Name`                    | Text(80)        | The name of the file in Google Drive |
| **File Name**              | `File_Name__c`            | Text(30)        | Original Salesforce file name        |
| **Google Drive File ID**   | `Google_Drive_File_ID__c` | Text Area(255)  | Unique Drive file ID                 |
| **Google Drive Link**      | `Google_Drive_Link__c`    | URL(255)        | Link to the file on Drive            |
| **Parent Record**          | `Parent_Record__c`        | Lookup(Account) | Record related to the file           |
| **Uploaded On**            | `Uploaded_On__c`          | Date/Time       | Upload timestamp                     |

📝 Usage:
This object tracks all files uploaded to Google Drive and can be used to access or manage them without storing the physical files in Salesforce.

### 4. **Apex Controller** GoogleDriveController`
Used by the LWC to retrieve Drive file records related to a Salesforce record.
```apex
public with sharing class GoogleDriveController {
    @AuraEnabled(cacheable=true)
    public static List<Google_Drive_File__c> getDriveFiles(Id recordId) {
        return [
            SELECT Id, File_Name__c, Google_Drive_Link__c, Uploaded_On__c
            FROM Google_Drive_File__c
            WHERE Parent_Record__c = :recordId
            ORDER BY Uploaded_On__c DESC
        ];
    }
}

```
### 5. **Lightning Web Component** googleDriveFiles`
Displays the list of uploaded Google Drive files on the record page.
#### HTML
```html

<template>
    <lightning-card title="Google Drive Files" icon-name="utility:link">
        <template if:true={files.data}>
            <lightning-datatable
                key-field="Id"
                data={files.data}
                columns={columns}>
            </lightning-datatable>
        </template>
        <template if:true={files.error}>
            <p class="slds-text-color_error">{files.error}</p>
        </template>
    </lightning-card>
</template>


```

#### JS 
```js

import { LightningElement, api, wire } from 'lwc';
import getDriveFiles from '@salesforce/apex/GoogleDriveController.getDriveFiles';

const columns = [
    { label: 'File Name', fieldName: 'File_Name__c', type: 'text' },
    {
        label: 'Google Drive Link',
        fieldName: 'Google_Drive_Link__c',
        type: 'url',
        typeAttributes: { label: 'Open in Drive', target: '_blank' }
    },
    { label: 'Uploaded On', fieldName: 'Uploaded_On__c', type: 'date' }
];

export default class GoogleDriveFiles extends LightningElement {
    @api recordId;
    columns = columns;

    @wire(getDriveFiles, { recordId: '$recordId' })
    files;
}


```

### ⚙️ Setup Instructions
#### 1 Create Named Credentail
Create two named credentails in salesforce
- 1. Name1:google_drive_named_cred
  2. URL1: https://www.googleapis.com/drive/v3

- 1. Name2:google_drive_namedCred_upload
  2. URL2: https://www.googleapis.com/upload/drive/v3

and then authenticate with OAuth2.0 

#### 2 Deploy Componenets
Deploy the following componenet
- GoogleDriveController.cls
- googleDriveFiles
- Google_Drive_File__c
- ContentVersionTrigger.trigger
- ContentVersionTriggerHandler.cls

#### 3 Add LWC to Record Page
- 1. Go to any Account record page in Lightning App Builder
  2. Drag the GoogleDriveFiles componenet onto the page
  3. Save and activate the layout

#### 🧾 Example Flow
- 1. A user uploads a file to an Account record in Salesforce.
  2. The trigger fires and sends the file to Google Drive.
  3. A folder structure is automatically created
  4. A record is created in Google_Drive_File__c with the Drive link.
  5. The LWC displays the uploaded file details directly on the record page

#### Tech Used : 
- Salesforce Apex
- Lightning Web Componenet
- Google Drive REST API
- Named Credential (OAuth 2.0)
- Asynchronous Callouts (@future)


### Author
Pradeep Kumar
[5761380@gmail.com]

