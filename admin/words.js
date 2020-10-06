/*global systemDictionary:true */
'use strict';

systemDictionary = {
    'Username (not email address from your LinkTap Account)': {
        'en': 'Username (not email address from your LinkTap Account)',
        'de': 'Benutzername (nicht zwingend E-Mail Adresse des LinkTap Kontos)'
    },
    'API key': {
        'en': 'API key',
        'de': 'API key'
    },
    'Interval for retrieving watering state in minutes (min. 1) Please enter integer values > 0. A parse is performed for non-integer values.<br />The gateways and taplinker devices are queried every hour or when the adapter is restarted. The manufacturer allows a minimum interval of 5 minutes.<br />If the adapter is restarted several times during this time, it is possible that the gateways / taplinkers cannot be determined immediately.': {
        'en': 'Interval for retrieving watering state in minutes (min. 1) Please enter integer values > 0. A parse is performed for non-integer values.<br />The gateways and taplinker devices are queried every hour or when the adapter is restarted. The manufacturer allows a minimum interval of 5 minutes.<br />If the adapter is restarted several times during this time, it is possible that the gateways / taplinkers cannot be determined immediately.',
        'de': 'Intervall zum Abrufen des Bewässerungsstatus in Minuten (min. 1) Bitte geben Sie ganzzahlige Werte > 0 ein. Für nicht ganzzahlige Werte wird ein Parse durchgeführt.<br />Die Gateways und Taplinker-Geräte werden stündlich oder beim Neustart des Adapters abgefragt. Der Hersteller erlaubt ein Mindestintervall von 5 Minuten.<br />Wenn der Adapter in dieser Zeit mehrmals neu gestartet wird, ist es möglich, dass die Gateways / Taplinker nicht sofort ermittelt werden können.'
    },
    'The start of the watering options can be initiated using the buttons. For this, however, it is necessary that the corresponding modes are also initially configured in the app. The API Link-Tap.com does not allow the creation of modes, but only the activation and changing of modes.<br /><br />Please also set the relevant arguments for executing the mode.<br /><br />Instant mode: InstantModeDuration<br /><br />Eco instant mode: InstantModeDuration, EcoInstantModeOn, EcoInstantModeOff': {
        'en': 'The start of the watering options can be initiated using the buttons. For this, however, it is necessary that the corresponding modes are also initially configured in the app. The API Link-Tap.com does not allow the creation of modes, but only the activation and changing of modes.<br /><br />Please also set the relevant arguments for executing the mode.<br /><br />Instant mode: InstantModeDuration<br /><br />Eco instant mode: InstantModeDuration, EcoInstantModeOn, EcoInstantModeOff',
        'de': 'Das Starten der Bewässerungsoptionen kann über die Buttons initiiert werden. Hierfür ist es jedoch erforderlich, dass die entsprechenden Modi auch in der App initial konfiguriert sind. Die API Link-Tap.com ermöglicht nicht das Erstellen von Modi, sondern nur das Aktivieren und Wechseln von Modi.<br /><br />Bitte auch die relevanten Argumente für die Ausführung des Modi setzen.<br /><br />Instant mode: InstantModeDuration<br /><br />Eco instant mode: InstantModeDuration, EcoInstantModeOn, EcoInstantModeOff'
    }
};