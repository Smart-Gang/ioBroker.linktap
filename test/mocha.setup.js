// Don't silently swallow unhandled rejections
process.on('unhandledRejection', (e) => {
    throw e;
});

// enable the should interface with sinon
// and load chai-as-promised and sinon-chai by default
//const sinonChai = require('sinon-chai');
//const { should, use } = require('chai');

//should();
//use(sinonChai);

// Dynamischer Import für ES-Module
//(async () => {
//	const chaiAsPromised = await import("chai-as-promised");
//	use(chaiAsPromised.default);
//})();