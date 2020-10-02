"use strict";
const fetch = require("node-fetch")
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

}
module.exports = LinkTapGateway;