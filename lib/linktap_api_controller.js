"use strict";
const fetch = require("node-fetch")
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
     * @returns {boolean} Success
     */      
    async getDevices() {
        const fctName = 'getDevices';   
        this.logger.info(fctName + ' started');   
        var requestData = '{"username": "'+this.username+'", "apiKey": "'+this.apiKey+'"}';
                
        await fetch(this.urlGetAllDevices, { 
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
            return true;         
          } else {
            this.logger.error("Error: "+json.message);
            this.connected = false;
            //throw new Error(json.message);
            return false;
          }
        });
        this.logger.info(fctName + ' finished');    
    }

  /**
   * Activate scheduling mode
   * Limit: Rate limiting is applied for this API. The minimum interval of calling this API is 15 seconds.   
   * @param {string[]} idParts      Required. String. Device ID
   * @returns {string} Success
   */     
  activateSchedulingMode(idParts){
    if(this.gateways.length > 0){
      this.gateways.forEach((g) => {
        if(g.gatewayId == idParts[2]){
          return g.activateSchedulingMode(idParts);
        }
      });
    } else {
      this.logger.error("No gateways found.");
      return "No gateways found."
    }
  }
}
module.exports = LinkTapApiController;