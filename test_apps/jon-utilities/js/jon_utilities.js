
var DIALER_COUNT = 500;
var PHONENUMBERS = 60;

var numbers = [];


  function FakeDialerDB() {

    this._dbName = 'dialerRecents';
    this._dbStore = 'dialerRecents';
    this._dbVersion = 1;
    this.prepolulated = false;
  }

  FakeDialerDB.prototype.init =  function(callback) {
    try {
      var indexedDB = window.indexedDB || window.webkitIndexedDB ||
                        window.mozIndexedDB || window.msIndexedDB;
      if (!indexedDB) {
        setStatusText('Indexed DB is not available!!!');
        return;
      }
      var self = this;
      // Open DB
      this.request = indexedDB.open(this._dbName, this._dbVersion);
      //Once DB is opened
      this.request.onsuccess = function(event) {
        //Store DB object in RecentsDBManager
        self.db = event.target.result;
        if (callback) {
          //Callback if needed
          callback();
        }
      };
      this.request.onerror = function(event) {
        // TODO Do we have to implement any custom error handler?
        setStatusText('Database error: ' + event.target.errorCode);
      };

      this.request.onupgradeneeded = function(event) {
        var db = event.target.result;
        var objStore = db.createObjectStore('dialerRecents',
          { keyPath: 'date' });
        objStore.createIndex('number', 'number');
      };
    } catch (ex) {
      setStatusText('Dialer recents IndexedDB exception:' + ex.message);
    }
  };
  
  FakeDialerDB.prototype.close = function() {
    this.db.close();
  };
  
  FakeDialerDB.prototype._checkDBReady = function(callback) {
    var self = this;
    if (!this.db) {
      this.request.addEventListener('success', function rdbm_DBReady() {
        self.request.removeEventListener('success', rdbm_DBReady);
        self._checkDBReady.call(self, callback);
      });
      return;
    }
    if (callback && callback instanceof Function) {
      callback.call(this);
    }
  };
  
  FakeDialerDB.prototype.add = function(recentCall, callback) {
    var self = this;
    this._checkDBReady.call(this, function() {
      var txn = self.db.transaction(self._dbStore, 'readwrite');
      var store = txn.objectStore(self._dbStore);
      var request = store.put(recentCall);
      request.onsuccess = function sr_onsuccess() {
        if (callback) {
          callback();
        }
      };
      request.onerror = function(e) {
        setStatusText('dialerRecents add failure ');
          // e.message + request.errorCode);
      };
   });
  };
  
  // Method for prepopulating the recents DB
  function createDialerHistory() {
    setStatusText('creating history - ' + DIALER_COUNT + ' numbers');
    var callDate = Date.now();
    setNumbers(function() {
      var dialerDB = new FakeDialerDB();
      dialerDB.init(function() {
        var recent;
        for (var i = 0; i < DIALER_COUNT; i++) {
          var num = Math.round(Math.random() * 10000) % numbers.length;
          callDate -= (Math.round(Math.random() * 28200000) + 600000); // variable length from 10 mintes - 8 hours
          recent = {
            date: callDate,
            type: 'incoming-connected',
            number: numbers[num]
          };
          dump('JON_UTIL: incoming call from ' + numbers[num]);
          dialerDB.add(recent);
          if (flipACoin()) {
            if (flipACoin()) {
              num = Math.round(Math.random() * 10000) % numbers.length;
            }
            callDate -= (Math.round(Math.random() * 28200000) + 600000); // variable length from 10 mintes - 8 hours
            recent = {
              date: callDate,
              type: 'dialing-connected',
              number: numbers[num]
            };
            dump('JON_UTIL: outgoing call to ' + numbers[num]);
            dialerDB.add(recent);
          };
        };
        dialerDB.close();
        setStatusText('done creating history - ' + DIALER_COUNT + ' numbers');
      });
    });
  };
  
  function flipACoin(value) {
    var threshold = (value) ? value : 0.5;
    return (Math.random() < threshold);
  };
  
  function randomPhoneNumber() {
    var areaCode = (Math.round(Math.random() * 899) + 100).toString();
    var exchange = (Math.round(Math.random() * 899) + 100).toString();
    var number = (Math.round(Math.random() * 8999) + 1000).toString();
    return areaCode.toString() + '-' + exchange.toString() + '-' + number.toString();
  };
  
  function setNumbers(numbersCallback) {
    numbers = [];
    var phoneNumber;
    var contactNumbers = [];
    getContacts(function(request) {
      for (var i = 0; i < request.result.length; i++) {
        var phoneNumbers = request.result[i].tel;
        var phoneNumbersCount = phoneNumbers.length;
        if (phoneNumbersCount) {
          if (phoneNumbersCount > 0) {
            phoneNumber = phoneNumbers[0].value;
            contactNumbers.push(phoneNumber);
            dump('JON_UTIL: baseline contact number: ' + phoneNumber);
          };
        };
      };
      for (var i = 0; i < PHONENUMBERS; i++) {
        if (flipACoin(0.25)) {
          phoneNumber = randomPhoneNumber();
          dump('JON_UTIL: random number: ' + phoneNumber);
        } else {
          var index = Math.round(Math.random() * 10000) % contactNumbers.length;
          phoneNumber = contactNumbers[index];
          dump('JON_UTIL: contact number: ' + phoneNumber);
        };
        numbers.push(phoneNumber);
      };
      numbersCallback();
    });
  };

  function getContacts(callback) {
    var options = {
      sortBy: 'familyName',
      sortOrder: 'ascending'
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function() {
      callback(request);
    };
    request.onerror = function() {
      alert('Problem receiving contacts');
    };
  };

  function createEmptyDialerHistory() {
    setStatusText('creating empty DB');
    var dialerDB = new FakeDialerDB();
    dialerDB.init(function() {
      dialerDB.close();
    });
    setStatusText('done creating empty DB');
  };


  function setStatusText(aString) {

    var insertionEl = document.getElementById('status-text');
    insertionEl.textContent = aString;
    dump('JON_UTIL - ' + aString);
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
  hide('dialer-history');

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

  document.getElementById('dialer-empty-create').addEventListener('click', createEmptyDialerHistory);
  document.getElementById('dialer-history-create').addEventListener('click', createDialerHistory);
  showHideDiv('click', 'h1-dialer-history');
});
