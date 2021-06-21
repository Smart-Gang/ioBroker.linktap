  /**
 *      LinkTap adapter
 *
 *      Controls LinkTap Wireless Water Timer via LinkTap Gateway
 *
 *      Copyright 2021 Smart-Gang <gangrulez@gmail.com>,
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
        this.dataPollIntervalTaplinker = 300000;
        this.dataPollTimeoutTaplinker = null;
        this.dataPollIntervalHistory = 3600000;
        this.dataPollTimeoutHistory = null;        
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
     * Creates all channels
     */
    async createChannels() {
        const fctName = 'createChannels';
        this.log.info(fctName + ' started');

        if(this.myApiController != null ){                        
            for(const g of this.myApiController.gateways) {
                await this.setObjectAsync(this.getId(g.gatewayId, null, null), {
                    type: 'channel',
                    role: 'gateway',
                    common: {
                        name: g.name,
                    },
                    native: {}
                });
                for(const d of g.devices) {                
                    await this.setObjectAsync(this.getId(g.gatewayId, d.taplinkerId, null), {
                        type: 'channel',
                        role: 'device',
                        common: {
                            name: d.taplinkerName,
                        },
                        native: {}
                    });
                }
            }
        }    
        this.log.info(fctName + ' finished');    
    } 

    /**
     * Creates or updates adapter objects
     */   
    async createOrUpdateObject(id, object){
        const foundObject = await this.getObjectAsync(id);
        if (foundObject == null) {
            await this.setObjectAsync(id, object);
            this.log.info('Creating new object: '+id);
            return; //new object
        }        
        if(foundObject.hasOwnProperty("common") && object.hasOwnProperty("common")) {
            if(JSON.stringify(foundObject.common) !== JSON.stringify(object.common)) {
                this.log.info('Update required for changed property: common for object: '+id);
                await this.setObjectAsync(id, object); //updating changed object
            }
        }                    
    }

    /**
     * Creates the data points
     */    
    async createDataPoints() {
        const fctName = 'createDataPoints';   
        this.log.info(fctName + ' started');
        if(this.myApiController != null ){
            const gatewayStructure = require("./lib/gateway.json");
            const taplinkerStructure = require("./lib/taplinker.json");            
            for(const g of this.myApiController.gateways) {                
                const gatewayObject = Object.assign({}, gatewayStructure);
                for (const gatewayProp in gatewayObject) {
                    var dataPointId = this.getId(g.gatewayId, null, gatewayProp)
                    await this.createOrUpdateObject(dataPointId, gatewayObject[gatewayProp]);
                    if(gatewayObject[gatewayProp].common.write === false){
                        this.setState(dataPointId, { val: g[gatewayProp], ack: true });
                    }
                }
                for(const d of g.devices) {        
                    const taplinkerObject = Object.assign({}, taplinkerStructure);
                    for (const taplinkerProp in taplinkerObject) {
                        var dataPointId = this.getId(g.gatewayId, d.taplinkerId, taplinkerProp)
                        await this.createOrUpdateObject(dataPointId, taplinkerObject[taplinkerProp]);
                        if(taplinkerObject[taplinkerProp].common.write === false){
                            this.setState(dataPointId, { val: d[taplinkerProp], ack: true });
                        } else {
                            if(taplinkerObject[taplinkerProp].common.role === "button"){
                                this.setState(dataPointId, { val: false, ack: true });
                            }                            
                        }                        
                    }
                }
            }
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
        this.dataPollTimeoutTaplinker = setInterval(async () =>  {       
            var fctName = 'updateTaplinkerStatus';
            this.log.info(fctName + ' started');
    
            if(this.myApiController != null ){
                await this.myApiController.getDevices();
            }
            this.setTaplinkerStates();
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
        this.dataPollTimeoutWatering = setInterval(async () =>  {       
            var fctName = 'updateWateringStatus';
            this.log.info(fctName + ' started');
    
            if(this.myApiController != null ){
                await this.myApiController.getWateringStatus();
            }
            this.setWateringStates();            
            this.log.info(fctName + ' finished');
        }, this.dataPollIntervalWatering);                    
        this.log.info(fctName + ' finished');    
    }

    /**
     * Creates data polling schedule for history
     */
     createHistoryScheduler() {
        const fctName = 'createHistoryScheduler';
        this.log.info(fctName + ' started');
    
        if(this.dataPollTimeoutHistory !== null) {
            clearInterval(this.dataPollTimeoutHistory);    
            this.dataPollTimeoutHistory = null;    
            this.log.info(fctName + ' scheduler stopped');
        }                        
        this.dataPollTimeoutHistory = setInterval(async () =>  {       
            var fctName = 'updateHistory';
            this.log.info(fctName + ' started');
    
            if(this.myApiController != null ){
                await this.myApiController.getHistory();
            }
            this.setHistoryState();            
            this.log.info(fctName + ' finished');
        }, this.dataPollIntervalHistory);                    
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
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'vol'), { val: d.vol, ack: true });
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
     * Set history state
     */    
     setHistoryState(){
        if(this.myApiController != null ){
            this.myApiController.gateways.forEach((g) => {
                g.devices.forEach(d => {
                    this.setState(this.getId(g.gatewayId,d.taplinkerId,'history'), { val: d.history, ack: true });
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

        if(isNaN(this.config.txtPollIntervalDevices) || this.config.txtPollIntervalDevices === "" || this.config.txtPollIntervalDevices === null){
            this.log.warn('No valid device poll interval found. Set poll interval to 10 minute.');            
          } else {
            var parsedPollIntervalDevices = parseInt(this.config.txtPollIntervalDevices, 10);
            if(parsedPollIntervalDevices < 5) parsedPollIntervalDevices = 5;
            this.log.info('Set device poll interval to '+parsedPollIntervalDevices+ ' minute(s).');
            this.dataPollIntervalTaplinker = (parsedPollIntervalDevices *60 * 1000)
        }        
        if(isNaN(this.config.txtPollIntervalWatering) || this.config.txtPollIntervalWatering === "" || this.config.txtPollIntervalWatering === null){
            this.log.warn('No valid watering poll interval found. Set poll interval to 1 minute.');            
          } else {
            var parsedPollIntervalWatering = parseInt(this.config.txtPollIntervalWatering, 10);
            if(parsedPollIntervalWatering < 1) parsedPollIntervalWatering = 1;
            this.log.info('Set water state poll interval to '+parsedPollIntervalWatering+ ' minute(s).');
            this.dataPollIntervalWatering = (parsedPollIntervalWatering *60 * 1000)
        }
        if(isNaN(this.config.txtPollIntervalHistory) || this.config.txtPollIntervalHistory === "" || this.config.txtPollIntervalHistory === null){
            this.log.warn('No valid history poll interval found. Set poll interval to 10 minute.');            
          } else {
            var parsedPollIntervalHistory = parseInt(this.config.txtPollIntervalHistory, 10);
            if(parsedPollIntervalHistory < 10) parsedPollIntervalHistory = 10;
            this.log.info('Set history state poll interval to '+parsedPollIntervalHistory+ ' minute(s).');
            this.dataPollIntervalHistory = (parsedPollIntervalHistory *60 * 1000)
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
        await this.myApiController.getWateringStatus();
        await this.myApiController.getHistory();
        await this.createChannels();                    
        await this.createDataPoints();                
        this.subscribeStates('*');        
        this.setConnected(this.myApiController.connected);
        this.createTaplinkerScheduler();
        this.createWateringScheduler();
        this.createHistoryScheduler();
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if(this.dataPollTimeoutTaplinker !== null) clearInterval(this.dataPollTimeoutTaplinker);
            if(this.dataPollTimeoutWatering !== null) clearInterval(this.dataPollTimeoutWatering);
            if(this.dataPollTimeoutHistory !== null) clearInterval(this.dataPollTimeoutHistory);
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
                            if(state.val === true) {
                                this.myApiController.startInstantMode(idParts, value);
                                this.setState(id, { val: false, ack: true });
                            }
                        });
                        break;
                    case "StartEcoInstantMode":
                        idParts.pop();
                        this.getCurrentState(idParts.join('.') + '.' + 'InstantModeDuration').then((value) => {
                            this.getCurrentState(idParts.join('.') + '.' + 'EcoInstantModeOn').then((ecoOn) => {
                                this.getCurrentState(idParts.join('.') + '.' + 'EcoInstantModeOff').then((ecoOff) => {
                                    if(state.val === true) {
                                        this.myApiController.startEcoInstantMode(idParts, value, ecoOn, ecoOff);
                                        this.setState(id, { val: false, ack: true });
                                    }
                                });
                            });
                        });
                        break;
                    case "StopInstantMode":
                        if(state.val === true) {
                            this.myApiController.stopInstantMode(idParts);
                            this.setState(id, { val: false, ack: true });
                        }
                        break;
                    default:
                        if(state.val === true) {
                            this.myApiController.activateSchedulingMode(idParts);
                            this.setState(id, { val: false, ack: true });
                        }                            
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