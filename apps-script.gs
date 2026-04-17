function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Responses') || ss.insertSheet('Responses');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'Prospect Name', 'Legal Business Name', 'DBA Name', 'Services', 'Service Area', 'Years In Business',
        'Licenses', 'Contact Info', 'Business Address', 'Website', 'Google Profile', 'Social', 'Directories', 'Reviews',
        'Website Login Email', 'Google Login Email', 'Meta Login Email', 'Other Logins', 'Domain Registrar',
        'Ideal Customer', 'Avg Price', 'Seasonality', 'Competitors', 'Lead Sources', 'Logo', 'Photos', 'Video',
        'Testimonials', 'Brand Feel', 'Volume', 'Contact Methods', 'Tracking', 'Ad Budget', 'Notes'
      ]);
    }

    var data = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var prospect = data.prospect_name || '';

    sheet.appendRow([
      new Date(), prospect,
      data.legalBusinessName || '', data.dbaName || '', data.services || '', data.serviceArea || '', data.yearsInBusiness || '',
      data.licenses || '', data.contactInfo || '', data.businessAddress || '', data.website || '', data.googleProfile || '', data.social || '', data.directories || '', data.reviews || '',
      data.websiteLoginEmail || '', data.googleLoginEmail || '', data.metaLoginEmail || '', data.otherLogins || '', data.domainRegistrar || '',
      data.idealCustomer || '', data.avgPrice || '', data.seasonality || '', data.competitors || '', data.leadSources || '', data.logo || '', data.photos || '', data.video || '',
      data.testimonials || '', data.brandFeel || '', data.volume || '', data.contactMethods || '', data.tracking || '', data.adBudget || '', data.notes || ''
    ]);

    MailApp.sendEmail({
      to: 'zayithp@gmail.com',
      subject: 'New Neighborly Work Questionnaire Submission' + (prospect ? ' - ' + prospect : ''),
      body: JSON.stringify(data, null, 2)
    });

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return HtmlService.createHtmlOutput('Questionnaire backend is live.');
}
