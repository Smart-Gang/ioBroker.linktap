"use strict";
const fetch = require("node-fetch")
const LinkTapGateway = require("./linktap_gateway");

/**
 * LinkTap API Controller  
 * @param {object} username - Required. username of taplinker account
 * @param {object} apiKey   - Required. API key of taplinker account. see: https://www.link-tap.com/#!/api-for-developers
 * @constructor
 */
class LinkTapApiController {
    constructor(username, apiKey) {        
      this.username = username;
      this.apiKey = apiKey;
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
    getDevices() {
        let queriedDevices = [];        
        var requestData = '{"username": "'+this.username+'", "apiKey": "'+this.apiKey+'"}';
                
        fetch(this.urlGetAllDevices, { 
          method: 'POST', 
          headers: this.headers, 
          body: requestData})
          .then((res) => {            
            console.log("Queried all devices. Status: "+res.status);
            return res.json();
        })
        .then((json) => {
          if(json.result == "ok") {
            this.connected = true;
            //console.log(json);
            json.devices.forEach((d) => {
              this.gateways.push(new LinkTapGateway(d, this.headers, this.username, this.apiKey));
          });   
            return true;         
          } else {
            console.log("Error: "+json.message);
            this.connected = false;
            //throw new Error(json.message);
            return false;
          }
        });
    }
}
module.exports = LinkTapApiController;