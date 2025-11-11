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
