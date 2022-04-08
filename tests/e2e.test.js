let parse = require('../src/index');

test('Single-field formula: e2e test', () => {

    let formula = `Name`
    let result = parse({object:'Account',formula});

    expect(Array.from(result.standardFields)).toEqual(expect.arrayContaining(['Account.Name'])); 

})



test('Standard formula: e2e test', () => {

    let formula = `IF(Owner.Contact.CreatedBy.Manager.Profile.Id = "03d3h000000khEQ",TRUE,false)

    &&
    
    IF(($CustomMetadata.Trigger_Context_Status__mdt.by_handler.Enable_After_Insert__c ||
    
      $CustomMetadata.Trigger_Context_Status__mdt.by_class.DeveloperName = "Default"),true,FALSE)
    
    &&
    
    IF( ($Label.Details = "Value" || Parent.Parent.Parent.LastModifiedBy.Contact.AssistantName = "Marie"), true ,false)

    &&

    IF( (Opportunity__r.Related_Asset__r.Name), true ,false)
    
    && IF ( ( $ObjectType.Center__c.Fields.My_text_field__c = "My_Text_Field__c") ,true,false)
    
    && IF ( ( $ObjectType.SRM_API_Metadata_Client_Setting__mdt.Fields.CreatedDate  = "My_Text_Field__c") ,true,false)
    
    && IF ( ( TEXT($Organization.UiSkin) = "lex" ) ,true,false)
    
    && IF ( ( $Setup.Customer_Support_Setting__c.Email_Address__c = "test@gmail.com" ) ,true,false)
    
    && IF ( (  $User.CompanyName = "acme" ) ,true,false)`

    let result = parse({object:'Account',formula});

   

    let expectedFunctions = [
        'IF','TRUE','FALSE','TEXT'
    ]

    expect(Array.from(result.functions)).toEqual(expect.arrayContaining(expectedFunctions)); 

    let expectedStandardFields = [
        'Account.OwnerId',
        'Account.LastModifiedById',
        'User.ContactId',
        'Contact.CreatedById',
        'User.ProfileId',
        'Profile.Id',
        'Trigger_Context_Status__mdt.DeveloperName',
        'Account.ParentId',
        'Contact.AssistantName',
        'SRM_API_Metadata_Client_Setting__mdt.CreatedDate',
        'User.CompanyName',
        'User.ManagerId',
        'Related_Asset__r.Name'
    ]

    expect(Array.from(result.standardFields)).toEqual(expect.arrayContaining(expectedStandardFields)); 

    let expectedCustomFields = [
        'Trigger_Context_Status__mdt.Enable_After_Insert__c',
        'Center__c.My_text_field__c',
        'Customer_Support_Setting__c.Email_Address__c',
        'Account.Opportunity__c'
    ]

    expect(Array.from(result.customFields)).toEqual(expect.arrayContaining(expectedCustomFields)); 

    let expectedCustomMetadataTypes = [
        'Trigger_Context_Status__mdt.by_handler',
        'Trigger_Context_Status__mdt.by_class'
    ]

    expect(Array.from(result.customMetadataTypes)).toEqual(expect.arrayContaining(expectedCustomMetadataTypes)); 

    let unexpectedCustomMetadataTypes = [
        'SRM_API_Metadata_Client_Setting__mdt.Fields',
    ]

    expect(Array.from(result.customMetadataTypes)).not.toEqual(expect.arrayContaining(unexpectedCustomMetadataTypes));

    let expectedCustomLabels = [
        'Details'
    ]

    expect(Array.from(result.customLabels)).toEqual(expect.arrayContaining(expectedCustomLabels)); 

    let expectedCustomSettings = [
        'Customer_Support_Setting__c'
    ]

    expect(Array.from(result.customSettings)).toEqual(expect.arrayContaining(expectedCustomSettings)); 

})



test('Process Builder formula: e2e test', () => {

    let formula = `IF([Account].Owner.Manager.Contact.Account.AccountNumber  = "text" ,TRUE,FALSE)

        ||

        IF([Account].original_lead__r.ConvertedAccountId != "",TRUE,FALSE)

        ||

        IF($CustomMetadata.Trigger_Context_Status__mdt.by_class.Enable_After_Delete__c , TRUE,FALse)`

    let result = parse({object:'Account',formula});

    let expectedStandardFields = [
        'Account.OwnerId',
        'User.ManagerId',
        'User.ContactId',
        'Contact.AccountId',
        'Account.AccountNumber',
        'original_lead__r.ConvertedAccountId'
    ]

    expect(Array.from(result.standardFields)).toEqual(expect.arrayContaining(expectedStandardFields)); 

    let expectedCustomFields = [
        'Trigger_Context_Status__mdt.Enable_After_Delete__c',
        'Account.original_lead__c'
    ]

    expect(Array.from(result.customFields)).toEqual(expect.arrayContaining(expectedCustomFields)); 

    let expectedCustomMetadataTypes = [
        'Trigger_Context_Status__mdt.by_class'
    ]

    expect(Array.from(result.customMetadataTypes)).toEqual(expect.arrayContaining(expectedCustomMetadataTypes)); 

})



test('CPQ Support for SBQQ__Quote__c', () => {

    let formula = `SBQQ__Distributor__r.Name `
    let result = parse({object:'SBQQ__Quote__c',formula});

    let expectedCustomFields = [
        'SBQQ__Quote__c.SBQQ__Distributor__c'
    ]

    expect(Array.from(result.customFields)).toEqual(expect.arrayContaining(expectedCustomFields)); 

    let expectedStandardFields = [
        'Account.Name'
    ]

    expect(Array.from(result.standardFields)).toEqual(expect.arrayContaining(expectedStandardFields)); 

})




