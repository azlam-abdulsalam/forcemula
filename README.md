
<img src="./img/logo.png">

# Forcemula 


<p align=center>

<img src="./coverage/badge-lines.svg">
<a href="https://github.com/pgonzaleznetwork/forcemula/actions/workflows/nodejs.yaml">
		<img src="https://github.com/pgonzaleznetwork/forcemula/workflows/Tests/badge.svg?style=flat" />
</a>
</p>

### Extract metadata from Salesforce formulas

`forcemula` in a `NPM` javascript module that helps with extracting the fields, objects, custom settings, etc., out of Salesforce formulas.

It can be used by Salesforce ISVs and DevOps vendors for multiple use cases such as:

*  Creating dependency graphs (impact analysis, deployment boundaries, etc.)
* Deployment auto-suggestion (i.e suggesting missing fields when deploying a formula to a target environment)
* Any other use case where it is necessary to known what metadata a formula depends on

`forcemula` does <mark>**not**</mark> the Salesforce API. All the parsing is done by evaluating the text representation of a formula in Salesforce. 

This makes it easy and safe to plug it into your existing product. 

### Why should I use this?

Extracting the fields and objects out of a Salesforce formula is easy if your formula looks like this

```
IF(ISPICKVAL(CustomerPriority__c,"High"),"Now","Later") 
```

But what if your formula looks like this?

```mysql

IF(Owner.Contact.CreatedBy.Manager.Profile.Id = "03d3h000000khEQ",TRUE,false)

&&

IF(($CustomMetadata.Trigger_Context_Status__mdt.by_handler.Enable_After_Insert__c ||

$CustomMetadata.Trigger_Context_Status__mdt.by_class.DeveloperName = "Default"),true,FALSE)

&&

IF( ($Label.Details = "Value" || Opportunity.Account.Parent.Parent.Parent.LastModifiedBy.Contact.AssistantName = "Marie"), true ,false)

&&

IF((Opportunity__r.Related_Asset__r.Name), true ,false)

&& IF (($ObjectType.Center__c.Fields.My_text_field__c = "My_Text_Field__c") ,true,false)

&& IF (($ObjectType.SRM_API_Metadata_Client_Setting__mdt.Fields.CreatedDate  = "My_Text_Field__c") ,true,false)

&& IF ((TEXT($Organization.UiSkin) = "lex" ) ,true,false)

&& IF (($Setup.Customer_Support_Setting__c.Email_Address__c = "test@gmail.com" ) ,true,false)

&& IF (( $User.CompanyName = "acme" ) ,true,false)`

```

`forcemula` makes extracting metadata a breeze: 

```javascript

let parse = require('forcemula');

let formulaText = getFromSalesforceApi(...);

let result = parse({'OpportunityLineItem',formulaText});

console.log(result);

```

```javascript
{
        functions: [ 'IF', 'TRUE', 'FALSE', 'TEXT' ],
        operators: [ '=', '&', '|' ],
        standardFields: [
          'OpportunityLineItem.OwnerId',
          'User.ContactId',
          'Contact.CreatedById',
          'User.ManagerId',
          'User.ProfileId',
          'Profile.Id',
          'Trigger_Context_Status__mdt.DeveloperName',
          'OpportunityLineItem.OpportunityId',
          'Opportunity.AccountId',
          'Account.ParentId',
          'Account.LastModifiedById',
          'Contact.AssistantName',
          'Related_Asset__r.Name',
          'SRM_API_Metadata_Client_Setting__mdt.CreatedDate',
          'Organization.UiSkin',
          'User.CompanyName'
        ],
        standardObjects: [
          'OpportunityLineItem',
          'User',
          'Contact',
          'Profile',
          'Opportunity',
          'Account',
          'Organization'
        ],
        customMetadataTypeRecords: [
          'Trigger_Context_Status__mdt.by_handler',
          'Trigger_Context_Status__mdt.by_class'
        ],
        customMetadataTypes: [
          'Trigger_Context_Status__mdt',
          'SRM_API_Metadata_Client_Setting__mdt'
        ],
        customFields: [
          'Trigger_Context_Status__mdt.Enable_After_Insert__c',
          'OpportunityLineItem.Opportunity__c',
          'Opportunity__r.Related_Asset__c',
          'Center__c.My_text_field__c',
          'Customer_Support_Setting__c.Email_Address__c'
        ],
        customLabels: [ 'Details' ],
        unknownRelationships: [ 'Opportunity__r', 'Related_Asset__r' ],
        customObjects: [ 'Center__c' ],
        customSettings: [ 'Customer_Support_Setting__c' ]
      }
```

There's a lot going on here so let's go through it one by one:

### Functions and Operators

All the functions and operators used by the formula are extracted. 

```javascript
functions: [ 'IF', 'TRUE', 'FALSE', 'TEXT' ]
operators: [ '=', '&', '|' ]
```

This can be used to calculate the complexity of a formula, sort formula fields by their operator, etc.

### User-based fields

All the user-based fields (even through parent-child relationships) are transformed to their API name, for example

```mysql
IF(Owner.Contact.CreatedBy.Manager.Profile.Id = "03d3h000000khEQ",TRUE,false)
```

results in the following 

```javascript
standardFields: [
    'OpportunityLineItem.OwnerId',
    'User.ContactId',
    'User.ManagerId',
    'User.ProfileId',
    ...
    ]
```

The following mapping took place

```javascript
Owner.Contact => User.ContactId
CreatedBy.Manager => User.ManagerId
Manager.ProfileId => User.ProfileId
```

### Self-referential relationships

Self-referential relationships, like Account > Parent > Parent; are transformed back to their original API name.

For example

```javascript
Opportunity.Account.Parent.Parent.Parent.LastModifiedBy.Contact.AssistantName = "Marie"
```

results in the following

```javascript
standardFields: [
    ...
    'Opportunity.AccountId',
    'Account.ParentId',
    'Account.LastModifiedById',
    ...
]
```

We know that `Parent.LastModifiedBy` maps to `Account.LastModifiedById` because `Account` was the last known parent in the relationship.

### Standard and custom fields

Standard and custom fields are extracted, whether they belong to standard objects, custom objects, custom settings and custom metadata types. For example

```
Account.Name => Standard field on a standard object
```

```
Account.Location__c => Custom field on a standard object
```

```
Quote__c.Name => Standard field on a custom object
```

```
Quote__c.Location__c => Custom field on a custom object
```

Repeat for Custom Settings and Custom Metadata Types. From the example at the top of this guide:

```javascript
 customFields: [
    'Trigger_Context_Status__mdt.Enable_After_Insert__c',
    'OpportunityLineItem.Opportunity__c',
    'Center__c.My_text_field__c',
    'Customer_Support_Setting__c.Email_Address__c'
]
```
```javascript
 standardFields: [
    ...
    'Trigger_Context_Status__mdt.DeveloperName',
    'OpportunityLineItem.OpportunityId'
 ]
```
### $ObjectType fields

The $ObjectType fields are transformed back to their API name. For example

```mysql
$ObjectType.SRM_API_Metadata_Client_Setting__mdt.Fields.CreatedDate
```
becomes:

```javascript
standardFields: [
    ...
    'SRM_API_Metadata_Client_Setting__mdt.CreatedDate',
    ]
```

### Custom Metadata Types

Custom metadata types are transformed to 3 different types. For example

```mysql
$CustomMetadata.Trigger_Context_Status__mdt.by_handler.Enable_After_Insert__c
````

becomes:

```javascript
 customFields: [
    'Trigger_Context_Status__mdt.Enable_After_Insert__c',
    ...
]
```
```javascript
customMetadataTypeRecords: [
        'Trigger_Context_Status__mdt.by_handler',
        'Trigger_Context_Status__mdt.by_class'
    ],
customMetadataTypes: [
        'Trigger_Context_Status__mdt'
    ],
```

### Standard relationship fields

Standard relationship fields are transformed back to their original API name. For example:

```mysql
Opportunity.Account.Name
````

becomes:

```javascript
 standardFields: [
    'Opportunity.AccountId',
    ...
]
```
### Custom relationship fields

Becomes `forcemula` does not use the Salesforce API to parse formulas (everything is done with the pure text representation of the formula), custom relationships are  <mark>**not transformed**</mark> back to their original API name. 

For example:

```mysql
Opportunity.Original_Account__r.Name
````

becomes:

```javascript
customFields: [
    'Original_Account__r.Name',
]
```

Additionally, the custom relationship will be added to the `unknownRelationships` array

```javascript
 unknownRelationships: [ 'Original_Account__r']
 ```

You must use the Salesforce API to figure out the real object behind this relationship. 