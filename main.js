  /**
 *      LinkTap adapter
 *
 *      Controls LinkTap Wireless Water Timer via LinkTap Gateway
 *
 *      Copyright 2020 Smart-Gang <gangrulez@gmail.com>,
 *      MIT License
 *
 */
'use strict';

const utils = require('@iobroker/adapter-core');
const LinkTapApiController = require("./lib/linktap_api_controller");


class LinkTap extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'linktap',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));

        this.connected = false;
        this.dataPollIntervalWatering = 60000;                
        this.dataPollTimeoutWatering = null;
        this.dataPollIntervalTaplinker = 3600000;        
        this.dataPollTimeoutTaplinker = null;        
        this.myApiController = null; 
    }


    /**
     * Gets ids for channels and states
     * @param {string} gatewayId    ID of gateway
     * @param {object} taplinkerId  ID of taplinker
     * @param {object} stateKey     ID of state
     */    
    getId(gatewayId, taplinkerId, stateKey){
        if(taplinkerId === null && stateKey === null){
            return gatewayId;
        }     
        if(gatewayId != null && taplinkerId != null && stateKey == null){
            return gatewayId+'.'+taplinkerId
        }            
        if(taplinkerId === null) {
            return gatewayId+'.'+stateKey;
        }
        return gatewayId+'.'+taplinkerId+'.'+stateKey;        
    }    

    /**
     * Gets the current value for the state
     * @param {string} id  ID of state
     */   
    getCurrentState(id) {
        return new Promise((resolve, reject) => {
            this.getState(id, function (err, state) {
                if (err) {
                    reject(err);
                } else {
                    if (typeof state != undefined && state != null) {
                        const value = state.val;
                        resolve(value);
                    } else {
                        const value = false;
                        resolve(value);
                    }
                }
            });
        });
    }    

    /**
     * Creates a data point
     * @param {string} id           ID of data point
     * @param {object} value        value
     * @param {string} displayName  Name of data point
     * @param {string} role         Role of data point
     * @param {boolean} _write      Write enabled
     * @param {object} _unit        Unit of of data point
     */
    async ensureDataPoint(id, value, displayName, role,  _write, _unit) {

        if(typeof(displayName) === null) displayName = id;
        if(typeof(_write) === null)
            _write = false;
        if(typeof(_write) !== 'boolean')
            _write = false;

        if(Array.isArray(value))
            value = value.toString();
        
        if(typeof(_unit) === null) {            
            await this.setObjectNotExistsAsync(id, {
                type: 'state',
                common: {
                    name: displayName,
                    type: typeof (value),
                    role: role,
                    read: true,
                    write: _write
                },
                native: { id: id }
            });

            if (typeof (value) !== null) {
                this.setState(id, {
                    val: value,
                    ack: true
                });
            }                                            
        } else {                     
            await this.setObjectNotExistsAsync(id, {
                type: 'state',
                common: {
                    name: displayName,
                    type: typeof (value),
                    role: role,
                    read: true,
                    write: _write,
                    unit: _unit
                },
                native: { id: id }
            });

            if (typeof (value) !== null) {
                this.setState(id, {
                    val: value,
                    ack: true
                });
            }                                            
        }
    } 

    /**
     * Creates a button state
     * @param {string} id           ID of state
     * @param {string} displayName  Name of state
     */
    async ensureButtonDataPoint(id, displayName){
        if(typeof(displayName) === null) displayName = id;
        await this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: {
                name: displayName,
                type: "boolean",
                role: "button",
                read: true,
                write: true
            },
            native: {id: id}
        });       
    }


    /**
     * Creates a integer state
     * @param {string} id           ID of state
     * @param {string} displayName  Name of state
     * @param {string} role         Role of state
     * @param {number} min          Min value
     * @param {number} max          Max value
     */
    async ensureIntegerDataPoint(id, displayName, role, min, max){
        if(typeof(displayName) === null) displayName = id;
        await this.setObjectNotExistsAsync(id, {
            type: 'state',
            common: {
                name: displayName,
                type: "number",
                role: role,
                read: true,
                write: true,
                min: min,
                max: max                
            },
            native: {id: id}
        });       
    }    


    /**
     * Creates all channels
     */
    async createChannels() {
        const fctName = 'createChannels';
        this.log.info(fctName + ' started');

        if(this.myApiController != null ){            
            this.myApiController.gateways.forEach(async (g) => {
                await this.setObjectNotExistsAsync(this.getId(g.gatewayId, null, null), {
                    type: 'channel',
                    role: 'gateway',
                    common: {
                        name: g.name,
                    },
                    native: {}
                }, function (err) {
                    if (err) {
                        this.log.error('Cannot write object: ' + err);
                    }
                });

                await g.devices.forEach(async (d) => {
                    await this.setObjectNotExistsAsync(this.getId(g.gatewayId, d.taplinkerId, null), {
                        type: 'channel',
                        role: 'device',
                        common: {
                            name: d.taplinkerName,
                        },
                        native: {}
                    }, function (err) {
                        if (err) {
                            this.log.error('Cannot write object: ' + err);
                        }
                    });
                });

            });  
        }    
        this.log.info(fctName + ' finished');    
    } 


    /**
     * Creates the data points
     */    
    async createDataPoints() {
        const fctName = 'createDataPoints';   
        this.log.info(fctName + ' started');    
        if(this.myApiController != null ){
            this.myApiController.gateways.forEach(async (g) => {
                await this.ensureDataPoint(this.getId(g.gatewayId, null, 'gatewayId'), g.gatewayId, "Gateway ID", "gateway", false, null);
                await this.ensureDataPoint(this.getId(g.gatewayId, null, 'name'), g.name, "Gateway name", "gateway", false, null);
                await this.ensureDataPoint(this.getId(g.gatewayId, null, 'location'), g.location, "Gateway location", "gateway", false, null);
                await this.ensureDataPoint(this.getId(g.gatewayId, null, 'status'), g.status, "Gateway status", "gateway", false, null);
                await this.ensureDataPoint(this.getId(g.gatewayId, null, 'version'), g.version, "Gateway version", "gateway", false, null);
                await g.devices.forEach(async (d) => {
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'taplinkerName'), d.taplinkerName, "Device name", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'location'), d.location, "Device location", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'taplinkerId'), d.taplinkerId, "Device ID", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'status'), d.status, "Device status", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'version'), d.version, "Device version", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'signal'), d.signal, "Device signal strength", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'batteryStatus'), d.batteryStatus, "Device batteryStatus", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'workMode'), d.workMode, "Device workMode", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'watering'), d.watering, "Device watering active", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'vel'), d.vel, "Device flow rate", "device", false, 'ml/min');
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'fall'), d.fall, "Device fall", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'valveBroken'), d.valveBroken, "Device valve broken", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'noWater'), d.noWater, "Device no water", "device", false, null);
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'total'), d.total, "Device total of current watering slot", "device", false, 'min');
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'onDuration'), d.onDuration, "Device on duration of current watering slot", "device", false, 'min');
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'ecoTotal'), d.ecoTotal, "Device eco Total of current eco watering slot", "device", false, 'min');
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'ecoOn'), d.ecoOn, "Device eco on", "device", false, 'min');
                    await this.ensureDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'ecoOff'), d.ecoOff, "Device eco off", "device", false, 'min');

                    await this.ensureButtonDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'ActivateIntervalMode'), "Activates interval mode");
                    await this.ensureButtonDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'ActivateOddEvenMode'), "Activates odd even mode");
                    await this.ensureButtonDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'ActivateMonthMode'), "Activates month mode");
                    await this.ensureButtonDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'ActivateSevenDayMode'), "Activates seven day mode");
                    await this.ensureButtonDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'StartInstantMode'), "Starts instant mode. (Set duration in state 'InstantModeDuration'");
                    await this.ensureButtonDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'StopInstantMode'), "Stops instant / eco instant mode");
                    await this.ensureIntegerDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'InstantModeDuration'), "Duration for instant mode (min.1  - max. 1439)", "state argument in", 1, 1439);
                    await this.ensureButtonDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'StartEcoInstantMode'), "Starts eco instant mode. (Set duration in state 'InstantModeDuration' and 'EcoInstantModeOn' / 'EcoInstantModeOff'");
                    await this.ensureIntegerDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'EcoInstantModeOn'), "The valve ON duration (unit is minute). This value needs to be less than duration.", "state argument in", 1, 1438);
                    await this.ensureIntegerDataPoint(this.getId(g.gatewayId, d.taplinkerId, 'EcoInstantModeOff'), "The valve OFF duration (unit is minute).", "state argument in", 1, 1438);
                });
            });
        }            
        this.log.info(fctName + ' finished');    
    }

    /**
     * Creates data polling schedule for gateways and devices
     */
    createTaplinkerScheduler() {
        const fctName = 'createTaplinkerScheduler';
        this.log.info(fctName + ' started');
    
        if(this.dataPollTimeoutTaplinker !== null) {
            clearInterval(this.dataPollTimeoutTaplinker);    
            this.dataPollTimeoutTaplinker = null;    
            this.log.info(fctName + ' scheduler stopped');
        }                        
        this.dataPollTimeoutTaplinker = setInterval(() =>  {       
            var fctName = 'updateTaplinkerStatus';
            this.log.info(fctName + ' started');
    
            if(this.myApiController != null ){
                this.myApiController.getDevices();
            }
            this.setTaplinkerStates();
            //this.createWateringScheduler();
            this.log.info(fctName + ' finished');
        }, this.dataPollIntervalTaplinker);                    
        this.log.info(fctName + ' finished');    
    }    

    /**
     * Creates data polling schedule for watering state
     */
    createWateringScheduler() {
        const fctName = 'createWateringScheduler';
        this.log.info(fctName + ' started');
    
        if(this.dataPollTimeoutWatering !== null) {
            clearInterval(this.dataPollTimeoutWatering);    
            this.dataPollTimeoutWatering = null;    
            this.log.info(fctName + ' scheduler stopped');
        }                        
        this.dataPollTimeoutWatering = setInterval(() =>  {       
            var fctName = 'updateWateringStatus';
            this.log.info(fctName + ' started');
    
            if(this.myApiController != null ){
                this.myApiController.gateways.forEach((g) => {
                    g.devices.forEach(d => {
                        d.queryWateringStatus();
                    });
                });
            }
            this.setWateringStates();            
            this.log.info(fctName + ' finished');
        }, this.dataPollIntervalWatering);                    
        this.log.info(fctName + ' finished');    
    }

    /**
     * Set watering states
     */    
    setWateringStates(){
        if(this.myApiController != null ){
            this.myApiController.gateways.forEach((g) => {
                g.devices.forEach(d => {
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'watering'), { val: d.watering, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'vel'), { val: d.vel, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'total'), { val: d.total, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'onDuration'), { val: d.onDuration, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'ecoTotal'), { val: d.ecoTotal, ack: true });                    
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'ecoOn'), { val: d.ecoOn, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'ecoOff'), { val: d.ecoOff, ack: true });
                });
            });
        }
    }    

    /**
     * Set gateway / device states
     */    
    setTaplinkerStates(){
        if(this.myApiController != null ){
            this.myApiController.gateways.forEach((g) => {
                this.setState(this.getId(g.gatewayId,null,'name'), { val: g.name, ack: true });
                this.setState(this.getId(g.gatewayId,null,'status'), { val: g.status, ack: true });
                this.setState(this.getId(g.gatewayId,null,'location'), { val: g.location, ack: true });
                this.setState(this.getId(g.gatewayId,null,'version'), { val: g.version, ack: true });
                this.setState(this.getId(g.gatewayId,null,'gatewayId'), { val: g.gatewayId, ack: true });
                g.devices.forEach(d => {
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'taplinkerId'), { val: d.taplinkerId, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'taplinkerName'), { val: d.taplinkerName, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'location'), { val: d.location, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'status'), { val: d.status, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'version'), { val: d.version, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'signal'), { val: d.signal, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'batteryStatus'), { val: d.batteryStatus, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'workMode'), { val: d.workMode, ack: true });                    
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'fall'), { val: d.fall, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'valveBroken'), { val: d.valveBroken, ack: true });
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'noWater'), { val: d.noWater, ack: true });
                });
            });
        }
    }       

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        this.setConnected(false);

        this.log.info('User : ' + this.config.txtUsername);

        if (!this.config.txtUsername || !this.config.txtApiKey) {
            this.log.warn('Please open Admin page for this adapter to set the username and the API key.');
            return;
        }         
        
        if(isNaN(this.config.txtPollInterval) || this.config.txtPollInterval === "" || this.config.txtPollInterval === null){
            this.log.warn('No valid poll interval found. Set poll interval to 1 minute.');            
          } else {
            var parsedPollIntervall = parseInt(this.config.txtPollInterval, 10);
            if(parsedPollIntervall < 1) parsedPollIntervall = 1;
            this.log.info('Set get water state poll interval to '+parsedPollIntervall+ ' minute(s).');
            this.dataPollIntervalWatering = (parsedPollIntervall *60 * 1000)
        }     
        const foreignObject = this.getForeignObject('system.config', (err, obj) => {            
            this.myApiController = new LinkTapApiController({
                logger: this.log,            
                username: this.config.txtUsername,
                apiKey: this.config.txtApiKey
            });              
            this.queryAndCreateStructure();                       
        });                   
    }

    /**
     * Queries gateways and devices and creates the data structure
     */
    async queryAndCreateStructure(){        
        await this.myApiController.getDevices();
        await this.createChannels();                    
        await this.createDataPoints();                    
        this.subscribeStates('*');        
        this.setConnected(this.myApiController.connected);
        this.createTaplinkerScheduler();
        this.createWateringScheduler();                          
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if(this.dataPollTimeoutTaplinker !== null) clearInterval(this.dataPollTimeoutTaplinker);
            if(this.dataPollTimeoutWatering !== null) clearInterval(this.dataPollTimeoutWatering);
            this.setConnected(false);
            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (!id || !state || state.ack) return;
        this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        if (id.endsWith('ActivateSevenDayMode')
            || id.endsWith('ActivateOddEvenMode')
            || id.endsWith('ActivateMonthMode')
            || id.endsWith('ActivateIntervalMode')
            || id.endsWith('StartInstantMode')
            || id.endsWith('StopInstantMode')
            || id.endsWith('StartEcoInstantMode')) {
            if (this.myApiController != null) {
                var idParts = id.split('.');
                if (idParts.length != 5) {
                    this.logger.error("ID: " + id + " has invalid format.");
                    return "Error while activating scheduling mode.";
                }
                switch (idParts[4]) {
                    case "StartInstantMode":
                        idParts.pop();
                        this.getCurrentState(idParts.join('.') + '.' + 'InstantModeDuration').then((value) => {
                            this.myApiController.startInstantMode(idParts, value);
                        });
                        break;
                    case "StartEcoInstantMode":
                        idParts.pop();
                        this.getCurrentState(idParts.join('.') + '.' + 'InstantModeDuration').then((value) => {
                            this.getCurrentState(idParts.join('.') + '.' + 'EcoInstantModeOn').then((ecoOn) => {
                                this.getCurrentState(idParts.join('.') + '.' + 'EcoInstantModeOff').then((ecoOff) => {
                                    this.myApiController.startEcoInstantMode(idParts, value, ecoOn, ecoOff);
                                });
                            });
                        });
                        break;
                    case "StopInstantMode":
                        this.myApiController.stopInstantMode(idParts);
                        break;
                    default:
                        this.myApiController.activateSchedulingMode(idParts);
                        break;
                }
            }
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.message" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //     if (typeof obj === 'object' && obj.message) {
    //         if (obj.command === 'send') {
    //             // e.g. send email or pushover or whatever
    //             this.log.info('send command');

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    //         }
    //     }
    // }

    /**
     * Set connected state
     * @param {boolean} isConnected
     */
    setConnected(isConnected) {
        if (this.connected !== isConnected) {
            this.connected = isConnected;            
        }
    }
       
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new LinkTap(options);
} else {
    // otherwise start the instance directly
    new LinkTap();
}