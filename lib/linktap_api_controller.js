"use strict";
const fetch = require('node-fetch-commonjs')
const LinkTapGateway = require("./linktap_gateway");

/**
 * LinkTap API Controller  
 * @constructor
 */
class LinkTapApiController {
    constructor(options) {           
      this.options = options || {};
      this.logger = this.options.logger;
      this.username = this.options.username;
      this.apiKey = this.options.apiKey;
      this.urlGetAllDevices = "https://www.link-tap.com/api/getAllDevices";        
      this.headers = {
          "Content-type": "application/json"
      };
      this.connected = false;
      this.gateways = []; // LinkTapGateway           
    }

    /**
     * Get All Devices (Gateway and Taplinker)'s Info
     * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 5 minutes.
     */      
    async getDevices() {
        var requestData = '{"username": "'+this.username+'", "apiKey": "'+this.apiKey+'"}';
                
        const loadDevices = await fetch(this.urlGetAllDevices, { 
          method: 'POST', 
          headers: this.headers, 
          body: requestData})
          .then((res) => {            
            this.logger.info("Queried all devices. Status: "+res.status);
            return res.json();
        })
        .then((json) => {
          if(json.result == "ok") {
            this.connected = true;
            this.gateways = [];
            json.devices.forEach((g) => {
              this.gateways.push(new LinkTapGateway({
                logger: this.logger,            
                username: this.username,
                apiKey: this.apiKey,
                gateway: g,
                headers: this.headers
              }));
            });         
          } else {
            this.logger.error("Error: "+json.message);
            this.connected = false;
          }
        }).catch(err => {
          this.logger.error("Error getDevices: "+err);
        });
    }

    /**
     * Get watering history of all devices     
     */         
    async getHistory() {
      for(const g of this.gateways) {
        for(const d of g.devices) { 
          await d.getHistory();
        }
      }      
    }

    /**
     * Get watering status of all devices     
     */         
     async getWateringStatus() {
      for(const g of this.gateways) {
        for(const d of g.devices) { 
          await d.queryWateringStatus();
        }
      }      
    }    

  /**
   * Activate scheduling mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {string[]} idParts      Required. String. Device ID   
   */     
  activateSchedulingMode(idParts){
    if(this.gateways.length > 0){
      this.gateways.forEach((g) => {
        if(g.gatewayId == idParts[2]){
          g.activateSchedulingMode(idParts);
        }
      });
    } else {
      this.logger.error("No gateways found.");      
    }    
  }

  /**
   * Starts instant mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {string[]} idParts      Required. String. Device ID
   * @param {number} duration      Required. String. Device ID
   */     
  startInstantMode(idParts, duration){
    if(this.gateways.length > 0){
      this.gateways.forEach((g) => {
        if(g.gatewayId == idParts[2]){
          g.startInstantMode(idParts, duration);
        }
      });
    } else {
      this.logger.error("No gateways found.");      
    }
  }  

  /**
   * Stops instant mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {string[]} idParts      Required. String. Device ID   
   */     
  stopInstantMode(idParts){
    if(this.gateways.length > 0){
      this.gateways.forEach((g) => {
        if(g.gatewayId == idParts[2]){
          g.stopInstantMode(idParts);
        }
      });
    } else {
      this.logger.error("No gateways found.");      
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
    if(this.gateways.length > 0){
      this.gateways.forEach((g) => {
        if(g.gatewayId == idParts[2]){
          g.startEcoInstantMode(idParts, duration, ecoOn, ecoOff);
        }
      });
    } else {
      this.logger.error("No gateways found.");      
    }
  }    
}
module.exports = LinkTapApiController;