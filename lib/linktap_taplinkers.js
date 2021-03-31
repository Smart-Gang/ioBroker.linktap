"use strict";
const fetch = require("node-fetch")
/**
 * A LinkTap TapLinker (connected device)
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
    constructor(options) {     
      this.options = options || {};
      this.logger = this.options.logger;
      this.username = this.options.username;
      this.apiKey = this.options.apiKey;
      this.headers = this.options.headers;         
      this.gatewayId = this.options.gatewayId;
      this.taplinkerName = this.options.taplinker.taplinkerName;
      this.location = this.options.taplinker.location;
      this.taplinkerId = this.options.taplinker.taplinkerId;
      this.status = this.options.taplinker.status;
      this.version = this.options.taplinker.version;
      this.signal = this.options.taplinker.signal; //percent value
      this.batteryStatus = this.options.taplinker.batteryStatus; //percent value
      this.workMode = this.options.taplinker.workMode;
      if(this.options.taplinker.watering == null) {
         this.watering = false;
      } else {
         this.watering = this.options.taplinker.watering;
      }
      this.vel = this.options.taplinker.vel; //int
      this.vol = this.options.taplinker.vol //int      
      this.fall = this.options.taplinker.fall; //bool
      this.valveBroken = this.options.taplinker.valveBroken; //bool
      this.noWater = this.options.taplinker.noWater; 
      this.history = this.options.taplinker.history //array
      this.urlGetWateringStatus = "https://www.link-tap.com/api/getWateringStatus";
      this.urlActivateInstantMode = "https://www.link-tap.com/api/activateInstantMode";
      this.urlActivateIntervalMode = "https://www.link-tap.com/api/activateIntervalMode";
      this.urlActivateOddEvenModee = "https://www.link-tap.com/api/activateOddEvenMode";
      this.urlActivateSevenDayMode = "https://www.link-tap.com/api/activateSevenDayMode";
      this.urlActivateMonthMode = "https://www.link-tap.com/api/activateMonthMode";
      this.urlHistory = "https://www.link-tap.com/api/getWateringHistory";      
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
        this.logger.info("Queried watering status. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          if (json.status == null) {
            this.vel = 0;
            this.watering = false;
          } else {
            this.watering = true;
            if(json.status.vel != null){
              this.vel = json.status.vel;
            }
            if(json.status.vol != null){
              this.vol = json.status.vol;
            }            
            this.onDuration = json.status.onDuration;
            this.ecoTotal = json.status.ecoTotal;
            this.ecoOn = json.status.ecoOn;
            this.ecoOff = json.status.ecoOff;
            this.total = json.status.total;
          }
        } else {
          this.logger.error("Error: " + json.message);          
        }
      }).catch(err => {
        this.logger.error("Error queryWateringStatus: "+err);
      });
  }

  /**
   * Query Watering Historical Data for the Past 30 Days
   * Rate limiting is applied for this API. The minimum interval of calling this API is 10 minutes.
   */  
   getHistory() {    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '"}';
    fetch(this.urlHistory, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        this.logger.info("Queried history. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          if (json.status != null) {            
            this.history = json.status;
          } 
        } else {
          this.logger.error("Error: " + json.message);          
        }
      }).catch(err => {
        this.logger.error("Error getHistory: "+err);
      });
  }  

  /**
   * Activate Instant Mode for Watering ON and OFF
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {boolean} action      Required. Boolean type. "true" for Watering ON, "false" for Watering OFF.
   * @param {number} duration     Required. Number type. The watering duration (unit is minute). For Watering OFF, this field is 0. For Watring ON, the range is from 1 minute to 1439 minutes.
   * @param {boolean} autoBack    Optional. String or Boolean type. "true" for automatically re-activating the previous watering plan after watering in Instant Mode is completed.
   */  
  activateInstantMode(action, duration, autoBack) {    
    if(action === true) {
      if(duration < 1 || duration > 1439){
        this.logger.error('Invlaid InstantModeDuration value. Duration range is from 1 minute to 1439 minutes. No mode was set.');
        return;
      }
    }
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '", "gatewayId": "' + this.gatewayId.substring(0, 16) + '", "action": "' + action + '", "duration": "' + duration + '", "autoBack": "' + autoBack + '", "eco": "false"}';
    fetch(this.urlActivateInstantMode, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        this.logger.info('Sent instant mode command with action: '+action+' and duration: '+duration+'. Status: ' + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {          
          //do nothing
        } else {
          this.logger.error("Error: " + json.message);
        }
      }).catch(err => {
        this.logger.error("Error activateInstantMode: "+err);
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
   */  
  activateEcoInstantMode(action, duration, autoBack, ecoOn, ecoOff) {    
    if(action === true) {
      if(duration < 1 || duration > 1439){
        this.logger.error('Invlaid InstantModeDuration value. Duration range is from 1 minute to 1439 minutes. No mode was set.');
        return;
      }
      if(ecoOn === null || ecoOff === null){
        this.logger.error('Invlaid EcoInstantModeOn /EcoInstantModeOff value(s). Duration range is from 1 minute to 1439 minutes. No mode was set.');
        return;
      }
      if(ecoOn >= duration){
        this.logger.error('Invalid EcoInstantModeOn value. The value need to be less than InstantModeDuration. No mode was set.');
        return;
      }      
    }    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '", "gatewayId": "' + this.gatewayId.substring(0, 16) + '", "action": "' + action + '", "duration": "' + duration + '", "autoBack": "' + autoBack + '", "eco": "true", "ecoOn": "' + ecoOn + '", "ecoOff": "' + ecoOff + '"}';
    fetch(this.urlActivateInstantMode, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        this.logger.info("Sent eco instant mode command. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {
          //do nothing
        } else {
          this.logger.error("Error: " + json.message);
        }
      }).catch(err => {
        this.logger.error("Error activateEcoInstantMode: "+err);
      });      
  }

  /**
   * Activate scheduling mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {string[]} idParts      Required. String. Device ID   
   */  
  activateSchedulingMode(idParts) {    
    var requestData = '{"username": "' + this.username + '", "apiKey": "' + this.apiKey + '", "taplinkerId": "' + this.taplinkerId.substring(0, 16) + '", "gatewayId": "' + this.gatewayId.substring(0, 16) + '"}';
    var serviceUrl = null;
    switch (idParts[4]) {
      case "ActivateIntervalMode":
        this.logger.info("Activating Interval Mode.");
        serviceUrl = this.urlActivateIntervalMode;
        break;
      case "ActivateOddEvenMode":
        this.logger.info("Activating Odd-Even Mode.");
        serviceUrl = this.urlActivateOddEvenModee;
        break;
      case "ActivateSevenDayMode":
        this.logger.info("Activating Seven Day Mode.");
        serviceUrl = this.urlActivateSevenDayMode;
        break;
      case "ActivateMonthMode":
        this.logger.info("Activating Month Mode.");
        serviceUrl = this.urlActivateMonthMode;
        break;
      default:
        this.logger.error("Unknown Mode value. Could not set mode.");
        break;
    }
    if(serviceUrl === null) return;

    fetch(serviceUrl, {
      method: 'POST',
      headers: this.headers,
      body: requestData
    })
      .then((res) => {
        this.logger.info("Sent mode command. Status: " + res.status);
        return res.json();
      })
      .then((json) => {
        if (json.result == "ok") {      
          //do nothing              
        } else {
          this.logger.error("Error: " + json.message);          
        }
      }).catch(err => {
        this.logger.error("Error activateSchedulingMode: "+err);
      });
  }  
}

module.exports = LinkTapTapLinker;