"use strict";
const fetch = require("node-fetch")
/**
 * A LinkTap TapLinker (connected device)
 * @param {object} taplinker - Object parsed from API response
 * @param {object} headers - HTTP Headers
 * @param {object} gatewayId - Gateway ID
 * @param {object} username - username
 * @param {object} apiKey - API key 
 * @constructor
 * 
 * total: the total watering duration of a watering slot.
 * onDuration: the remaining watering duration of a watering slot.
 * ecoTotal: the total watering duration of a watering plan when the ECO mode is enabled.
 * ecoOn: valve ON duration.
 * ecoOff: valve OFF duration.
 * vel: current flow rate (unit: ml per minute. For G2 only).* 
 */
class LinkTapTapLinker {
    constructor(taplinker, headers, gatewayId, username, apiKey) {     
      this.headers = headers;   
      this.gatewayId = gatewayId;
      this.username = username;
      this.apiKey = apiKey;
      this.taplinkerName = taplinker.taplinkerName;
      this.location = taplinker.location;
      this.taplinkerId = taplinker.taplinkerId;
      this.status = taplinker.status;
      this.version = taplinker.version;
      this.signal = taplinker.signal; //percent value
      this.batteryStatus = taplinker.batteryStatus; //percent value
      this.workMode = taplinker.workMode;
      this.watering = taplinker.watering;
      this.vel = taplinker.vel; //int
      this.fall = taplinker.fall; //bool
      this.valveBroken = taplinker.valveBroken; //bool
      this.noWater = taplinker.noWater; 
      this.urlGetWateringStatus = "https://www.link-tap.com/api/getWateringStatus";
      this.urlActivateInstantMode = "https://www.link-tap.com/api/activateInstantMode";
      this.urlActivateIntervalMode = "https://www.link-tap.com/api/activateIntervalMode";
      this.urlActivateOddEvenModee = "https://www.link-tap.com/api/activateOddEvenMode";
      this.urlActivateSevenDayMode = "https://www.link-tap.com/api/activateSevenDayMode";
      this.urlActivateMonthMode = "https://www.link-tap.com/api/activateMonthMode";
      this.total = 0;
      this.onDuration = 0;
      this.ecoTotal = 0;
      this.ecoOn = 0;
      this.ecoOff = 0;
    }


  /**
   * Queries the current watering status
   * Rate limiting is applied for this API. The minimum interval of calling this API is 30 seconds.
   */  
  queryWateringStatus() {    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '"}';
    fetch(this.urlGetWateringStatus, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        console.log("Queried watering status. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          //console.log(json);
          if (json.status == null) {
            this.vel = 0;
          } else {
            if(json.status.vel != null){
              this.vel = json.status.vel;
            }
            this.onDuration = json.status.onDuration;
            this.ecoTotal = json.status.ecoTotal;
            this.ecoOn = json.status.ecoOn;
            this.ecoOff = json.status.ecoOff;
            this.total = json.status.total;
          }
        } else {
          console.log("Error: " + json.message);
          //throw new Error(json.message);
        }
      });
  }

  /**
   * Activate Instant Mode for Watering ON and OFF
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {boolean} action      Required. String or Boolean type. "true" for Watering ON, "false" for Watering OFF.
   * @param {number} duration     Required. Number type. The watering duration (unit is minute). For Watering OFF, this field is 0. For Watring ON, the range is from 1 minute to 1439 minutes.
   * @param {boolean} autoBack    Optional. String or Boolean type. "true" for automatically re-activating the previous watering plan after watering in Instant Mode is completed.
   * @returns {string} Success
   */  
  activateInstantMode(action, duration, autoBack) {    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '", "gatewayId": "' + this.gatewayId.substring(0, 16) + '", "action": "' + action + '", "duration": "' + duration + '", "autoBack": "' + autoBack + '", "eco": "false"}';
    fetch(this.urlActivateInstantMode, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        console.log("Sent instant mode command. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          //console.log(json);
          return json.message;
        } else {
          console.log("Error: " + json.message);
          //throw new Error(json.message);
        }
      });
  }

  /**
   * Activate Eco Instant Mode for Watering ON and OFF
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {boolean} action      Required. String or Boolean type. "true" for Watering ON, "false" for Watering OFF.
   * @param {number} duration     Required. Number type. The watering duration (unit is minute). For Watering OFF, this field is 0. For Watring ON, the range is from 1 minute to 1439 minutes.
   * @param {boolean} autoBack    Optional. String or Boolean type. "true" for automatically re-activating the previous watering plan after watering in Instant Mode is completed.
   * @param {number} ecoOn        Required when eco equals "true". Number type. The valve ON duration (unit is minute). This value needs to be less than duration.
   * @param {number} ecoOff       Required when eco equals "true". Number type. The valve OFF duration (unit is minute).   
   * @returns {string} Success
   */  
  activateEcoInstantMode(action, duration, autoBack, ecoOn, ecoOff) {    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '", "gatewayId": "' + this.gatewayId.substring(0, 16) + '", "action": "' + action + '", "duration": "' + duration + '", "autoBack": "' + autoBack + '", "eco": "true", "ecoOn": "' + ecoOn + '", "ecoOff": "' + ecoOff + '"}';
    fetch(this.urlActivateInstantMode, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        console.log("Sent eco instant mode command. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          //console.log(json);
          return json.message;
        } else {
          console.log("Error: " + json.message);
          //throw new Error(json.message);
        }
      });
  }

  /**
   * Activate Interval Mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @returns {string} Success
   */  
  activateIntervalMode() {    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '", "gatewayId": "' + this.gatewayId.substring(0, 16) + '"}';
    fetch(this.urlActivateIntervalMode, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        console.log("Sent interval mode command. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          //console.log(json);
          return json.message;
        } else {
          console.log("Error: " + json.message);
          //throw new Error(json.message);
        }
      });
  }
  
  /**
   * Activate Instant Mode for Watering ON and OFF
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @returns {string} Success
   */  
  activateOddEvenMode(action, duration, autoBack) {    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '", "gatewayId": "' + this.gatewayId.substring(0, 16) + '"}';
    fetch(this.urlActivateOddEvenModee, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        console.log("Sent instant mode command. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          //console.log(json);
          return json.message;
        } else {
          console.log("Error: " + json.message);
          //throw new Error(json.message);
        }
      });
  }
  
  /**
   * Activate Seven Day Mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @returns {string} Success
   */  
  activateSevenDayMode(action, duration, autoBack) {    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '", "gatewayId": "' + this.gatewayId.substring(0, 16) + '"}';
    fetch(this.urlActivateSevenDayMode, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        console.log("Sent seven day mode command. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          //console.log(json);
          return json.message;
        } else {
          console.log("Error: " + json.message);
          //throw new Error(json.message);
        }
      });
  }
  
  /**
   * Activate Month Mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @returns {string} Success
   */  
  activateMonthMode(action, duration, autoBack) {    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '", "gatewayId": "' + this.gatewayId.substring(0, 16) + '"}';
    fetch(this.urlActivateMonthMode, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        console.log("Sent month mode command. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          //console.log(json);
          return json.message;
        } else {
          console.log("Error: " + json.message);
          //throw new Error(json.message);
        }
      });
  }  

}

module.exports = LinkTapTapLinker;