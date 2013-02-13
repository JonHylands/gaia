
'use strict';


function api_contactsReadNext(count, durationResults) {
  
  if (count >= 5) {
    summarizeResults('Contacts', 'getAll', durationResults);
    return;
  }
  var options = {
    sortBy: 'givenName',
    sortOrder: 'ascending'
  };
  var start = new Date();
  var request = navigator.mozContacts.find(options);
  request.onsuccess = function() {
    setStatusText('Contacts count: ' + request.result.length);
    var duration = new Date() - start;
    durationResults.push(duration);
    setStatusText('Read ' + count + ': ' + duration);
    api_contactsReadNext(count + 1, durationResults);
  };
  request.onerror = function() {
    setStatusText('Error ' + count + ': ' + req.error.name);
    api_contactsReadNext(count + 1, durationResults);
  };
}

function api_contactsReadAll() {

  var durationResults = [];
  api_contactsReadNext(0, durationResults);
}

//==========================================================================

function api_smsReadNext(count, durationResults) {
  
  if (count >= 5) {
    summarizeResults('Sms', 'getAll', durationResults);
    return;
  }
  var filter = new MozSmsFilter();
  filter.numbers = [];
  var start = new Date();
  var request = navigator.mozSms.getMessages(filter, true);
  var messages = [];
  request.onsuccess = function() {
    var cursor = request.result;
    if (cursor.message) {
      messages.push(cursor.message);
      cursor.continue();
    } else {
      setStatusText('Sms count: ' + messages.length);
      var duration = new Date() - start;
      durationResults.push(duration);
      setStatusText('Read ' + count + ': ' + duration);
      api_smsReadNext(count + 1, durationResults);
    };
  };
  request.onerror = function() {
    setStatusText('Error ' + count + ': ' + req.error.name);
    api_smsReadNext(count + 1, durationResults);
  };
}

function api_smsReadAll() {

  if (!navigator.mozSms) {
    setStatusText('mozSms is undefined');
    return;
  }
  setStatusText('smsReadAll');
  var durationResults = [];
  api_smsReadNext(0, durationResults);
}

//==========================================================================


function setStatusText(aString) {
  
  var insertionEl = document.getElementById('status-text');
  insertionEl.textContent = aString;
  dump('APITimer - ' + aString);
}

function summarizeResults(appName, apiName, durationResults) {
  
  var prefix = appName + ':' + apiName + ': ';
  var count = durationResults.length;
  if (count === 0) {
    setStatusText(prefix + 'No results');
    return;
  }
  var min = durationResults[0];
  var max = durationResults[0];
  var sum = 0;
  for (var index = 0; index < count; index++) {
    if (min > durationResults[index]) {
      min = durationResults[index];
    }
    if (max < durationResults[index]) {
      max = durationResults[index];
    }
    sum += durationResults[index];
  }

  var mean = Math.round(sum / count);
  setStatusText(prefix + 'min: ' + min + ' mean: ' + mean + ' max: ' + max);
}

function show(id) {
  
  var e = document.getElementById(id);
  if (e) {
    e.style.display = "block";
  }
}

function hide(id) {
  
  var e = document.getElementById(id);
  if (e) {
    e.style.display = "none";
  }
}

//==========================================================================

window.addEventListener('DOMContentLoaded', function() {

  setStatusText('');
  hide('contacts');
  hide('sms');

  var showHideDiv = function(ev, tgt) {
    var clicktarget = document.getElementById(tgt);
    clicktarget.addEventListener(ev, function(ev) {
      var target = ev.target.dataset['hide'];
      var el = document.getElementById(target);
      if (el) {
        if (el.style.display == "" || el.style.display == "block") {
          hide(target);
        } else {
          show(target);
        }
      }
    });
  };

  showHideDiv('click', 'h1-contacts');
  showHideDiv('click', 'h1-sms');
  document.getElementById('contacts-readall').addEventListener('click', api_contactsReadAll);
  document.getElementById('sms-readall').addEventListener('click', api_smsReadAll);
});
