"use strict";
const fetch = require('node-fetch-commonjs');
const LinkTapTapLinker = require("./linktap_taplinkers");

/**
 * A LinkTap Gateway
 * @constructor
 * 
 *  Explanation of some fields:
    workMode: currently activated work mode. ‘O’ is for Odd-Even Mode, ‘M’ is for Instant Mode, ‘I’ is for Interval Mode, ‘T’ is for 7-Day Mode, ‘Y’ is for Month Mode, ‘N’ means no work mode assigned.
    slot: current watering plan. 'H' represents hour, 'M' represents minute, 'D' represents duration.
    vel: latest flow rate (unit: ml per minute. For G2 only).
    fall: fall incident flag (boolean. For G2 only).
    valveBroken: valve failed to open flag (boolean. For G2 only).
    noWater: water cut-off flag (boolean. For G2 only).
 * 
 */
class LinkTapGateway {
    constructor(options) {    
        this.options = options || {};
        this.logger = this.options.logger;
        this.username = this.options.username;
        this.apiKey = this.options.apiKey;
        this.headers = this.options.headers;               
        this.name = this.options.gateway.name;
        this.location = this.options.gateway.location;
        this.gatewayId = this.options.gateway.gatewayId;
        this.status = this.options.gateway.status;
        this.version = this.options.gateway.version;
        this.devices = [];  //TapLinkers  
        this.options.gateway.taplinker.forEach((t) => {
            this.devices.push(new LinkTapTapLinker({
                logger: this.logger,            
                username: this.username,
                apiKey: this.apiKey,
                gatewayId: this.gatewayId,
                headers: this.headers,
                taplinker: t
            }));
        });               
    }

  /**
   * Activate scheduling mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {string[]} idParts      Required. String. Device ID
   */     
  activateSchedulingMode(idParts){
    if(this.devices.length > 0){
      this.devices.forEach((d) => {
        if(d.taplinkerId == idParts[3]){
          d.activateSchedulingMode(idParts);
        }
      });
    } else {
      this.logger.error("No devices found.");      
    }
  }  

  /**
   * Starts instant mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {string[]} idParts      Required. String. Device ID
   * @param {number} duration      Required. String. Device ID
   */     
  startInstantMode(idParts, duration){
    if(this.devices.length > 0){
      this.devices.forEach((d) => {
        if(d.taplinkerId == idParts[3]){
          d.activateInstantMode(true, duration, true);
        }
      });
    } else {
      this.logger.error("No devices found.");      
    }
  }    

  /**
   * Starts instant mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {string[]} idParts      Required. String. Device ID   
   */     
  stopInstantMode(idParts){
    if(this.devices.length > 0){
      this.devices.forEach((d) => {
        if(d.taplinkerId == idParts[3]){
          d.activateInstantMode(false, 0, true);
        }
      });
    } else {
      this.logger.error("No devices found.");      
    }
  }  

  /**
   * Starts eco instant mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {string[]} idParts    Required. String. Device ID
   * @param {number} duration     Required. String.
   * @param {number} ecoOn        Required when eco equals "true". Number type. The valve ON duration (unit is minute). This value needs to be less than duration.
   * @param {number} ecoOff       Required when eco equals "true". Number type. The valve OFF duration (unit is minute).
   */     
  startEcoInstantMode(idParts, duration, ecoOn, ecoOff){
    if(this.devices.length > 0){
      this.devices.forEach((d) => {
        if(d.taplinkerId == idParts[3]){
          d.activateEcoInstantMode(true, duration, true, ecoOn, ecoOff);
        }
      });
    } else {
      this.logger.error("No devices found.");      
    }
  }      

}
module.exports = LinkTapGateway;