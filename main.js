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
var myApiController = null;

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

        this.connected = null;
        this.dataPollInterval = 60000;
        this.dataPollTimeout = null;

    }

    getId(gatewayId, taplinkerId, stateKey){
        if(typeof(gatewayId) === 'undefined'  &&  typeof(taplinkerId) !== 'undefined' && typeof(stateKey) === 'undefined') {
            return 'gateways';
        }
        if(typeof(taplinkerId) === 'undefined' && typeof(stateKey) === 'undefined'){
            return 'gateways.'+gatewayId;
        }     
        if(typeof(gatewayId) !== 'undefined' && typeof(taplinkerId) !== 'undefined' && typeof(stateKey) === 'undefined'){
            return 'gateways.'+gatewayId+'.'+taplinkerId
        }            
        if(typeof(taplinkerId) === 'undefined') {
            return 'gateways.'+gatewayId+'.'+stateKey;
        }
        return 'gateways.'+gatewayId+'.'+taplinkerId+'.'+stateKey;        
    }    

    //Used for creating states
    createState(name, value, desc, _write, _unit) {

        if(typeof(desc) === 'undefined')
            desc = name;
        if(typeof(_write) === 'undefined')
            _write = false;
        if(typeof(_write) !== 'boolean')
            _write = false;

        if(Array.isArray(value))
            value = value.toString();

        if(typeof(_unit) === 'undefined') {
            this.setObjectNotExists(name, {
                type: 'state',
                common: {
                    name: name,
                    desc: desc,
                    type: typeof(value),
                    read: true,
                    write: _write
                },
                native: {id: name}
            }, function(err, obj) {
                if (!err && obj) {
                    if(typeof(value) !== 'undefined') {
                        this.setState(name, {
                            val: value,
                            ack: true
                        });
                    }
                }
            });
        } else {
            this.setObjectNotExists(name, {
                type: 'state',
                common: {
                    name: name,
                    desc: desc,
                    type: typeof(value),
                    read: true,
                    write: _write,
                    unit: _unit
                },
                native: {id: name}
            }, function(err, obj) {
                if (!err && obj) {
                    if(typeof(value) !== 'undefined') {
                        this.setState(name, {
                            val: value,
                            ack: true
                        });
                    }
                }
            });
        }
    } 

    //Creates all channels
    createChannels() {
        const fctName = 'createChannels';
        this.log.info(fctName + ' started');
        this.setObjectNotExists(this.getId(), {
            type: 'channel',
            role: 'gateways',
            common: {
                name: this.getId(),
            },
            native: {}
        }, function(err) {
            if (err) {
                this.log.error('Cannot write object: ' + err); 
            }
        });

        if(myApiController != null ){
            myApiController.gateways.forEach((g) => {
                this.setObjectNotExists(this.getId(g.gatewayId), {
                    type: 'channel',
                    role: 'gateway',
                    common: {
                        name: this.getId(g.gatewayId),
                    },
                    native: {}
                }, function(err) {
                    if (err) {
                        this.log.error('Cannot write object: ' + err); 
                    }
                });  
                g.devices.forEach(d => {
                    this.setObjectNotExists(this.getId(g.gatewayId, d.taplinkerId), {
                        type: 'channel',
                        role: 'device',
                        common: {
                            name:  this.getId(g.gatewayId, d.taplinkerId),
                        },
                        native: {}
                    }, function(err) {
                        if (err) {
                            this.log.error('Cannot write object: ' + err); 
                        }
                    });                      
                });              
            });  
        }    
        this.log.debug(fctName + ' finished');    
    } 

    setStates(){
        if(myApiController != null ){
            myApiController.gateways.forEach((g) => {
                this.setStateAsync(this.getId(g.gatewayId,null,'name'), { val: g.name, ack: true });
                this.setStateAsync(this.getId(g.gatewayId,null,'status'), { val: g.status, ack: true });
                this.setStateAsync(this.getId(g.gatewayId,null,'location'), { val: g.location, ack: true });
                this.setStateAsync(this.getId(g.gatewayId,null,'version'), { val: g.version, ack: true });
                g.devices.forEach(d => {
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'taplinkerName'), { val: d.taplinkerName, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'location'), { val: d.location, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'status'), { val: d.status, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'version'), { val: d.version, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'signal'), { val: d.signal, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'batteryStatus'), { val: d.batteryStatus, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'workMode'), { val: d.workMode, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'watering'), { val: d.watering, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'vel'), { val: d.vel, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'fall'), { val: d.fall, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'valveBroken'), { val: d.valveBroken, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'noWater'), { val: d.noWater, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'total'), { val: d.total, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'onDuration'), { val: d.onDuration, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'ecoTotal'), { val: d.ecoTotal, ack: true });                    
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'ecoOn'), { val: d.ecoOn, ack: true });
                    this.setStateAsync(this.getId(g.gatewayId,d.taplinkerId,'ecoOff'), { val: d.ecoOff, ack: true });
                });
            });
        }
    }

    createDPs() {

        const fctName = 'createDPs';   
        this.log.debug(fctName + ' started');
    
        if(myApiController != null ){
            myApiController.gateways.forEach((g) => {
                this.createState(this.getId(g.gatewayId,null,'id'), '');         
                this.createState(this.getId(g.gatewayId,null,'name'), '');
                this.createState(this.getId(g.gatewayId,null,'location'), '');
                this.createState(this.getId(g.gatewayId,null,'status'), '');
                this.createState(this.getId(g.gatewayId,null,'version'), '');
                g.devices.forEach(d => {
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'taplinkerName'), '');
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'location'),'');
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'taplinkerId'), '');
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'status'), '');          
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'version'), '');
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'signal'), 0, undefined, false, '%');
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'batteryStatus'), 0, undefined, false, '%');
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'workMode'), '');
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'watering'), '');
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'vel'), 0, undefined, false, 'ml/min');                    
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'fall'), false);                    
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'valveBroken'), false);                    
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'noWater'), false);                    
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'total'), 0, undefined, false, 'min');                    
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'onDuration'), 0,undefined, false, 'min');                    
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'ecoTotal'),0, undefined, false, 'min');                    
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'ecoOn'), 0, undefined, false, 'min');  
                    this.createState(this.getId(g.gatewayId,d.taplinkerId,'ecoOff'), 0), undefined, false, 'min';                      
                });
            });
        }            
        this.log.debug(fctName + ' finished');    
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        await this.setConnected(false);

        this.log.info('User : ' + this.config.txtUsername);

        if (!this.config.txtUsername || !this.config.txtApiKey) {
            this.log.warn('Please open Admin page for this adapter to set the username and the API key.');
            return;
        }                               
        this.myApiController = new LinkTapApiController(this.config.txtUsername, this.config.txtApiKey);
        this.myApiController.getDevices();
        await this.createChannels();
        await this.createDPs();

        this.subscribeStates('*');
        this.main();
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

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
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
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


    setConnected(isConnected) {
        if (this.connected !== isConnected) {
            this.connected = isConnected;
            this.setState('info.connection', this.connected, true);
        }
    }
    
    main(){
    
        if (this.dataPollInterval !== 0) {
            this.dataPollInterval = (this.config.txtPollInterval *60 * 1000) || this.dataPollInterval;
        }    
        
        //myApiController = new LinkTapApiController(this.config.txtUsername, this.config.txtApiKey);
        this.setConnected(myApiController.connected);

        this.setStates();
        
 

    }
    /*
    startDataPolling(fromTimeout) {
        if (this.dataPollTimeout) {
            !fromTimeout && clearTimeout(this.dataPollTimeout);
            this.dataPollTimeout = null;
        }
        if (this.dataPollInterval === 0) {
            this.log.info('Data polling deactivated.');
            return;
        }
    }    
    */
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