"use strict";
const fetch = require("node-fetch")
const LinkTapTapLinker = require("./linktap_taplinkers");

/**
 * A LinkTap Gateway
 * @param {object} gateway  - Object parsed from API response
 * @param {object} headers  - HTTP Headers
 * @param {object} username - username
 * @param {object} apiKey   - API key 
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
    constructor(gateway, headers, username, apiKey) {    
        this.headers = headers;               
        this.name = gateway.name;
        this.location = gateway.location;
        this.gatewayId = gateway.gatewayId;
        this.status = gateway.status;
        this.version = gateway.version;

        this.devices = [];  //TapLinkers  
        gateway.taplinker.forEach((t) => {
            this.devices.push(new LinkTapTapLinker(t, this.headers, this.gatewayId, username, apiKey));
        });               
    }

}
module.exports = LinkTapGateway;