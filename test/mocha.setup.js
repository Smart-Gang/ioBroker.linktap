// Don't silently swallow unhandled rejections
process.on('unhandledRejection', (e) => {
    throw e;
});

// enable the should interface with sinon
// and load chai-as-promised and sinon-chai by default
const sinonChai = require('sinon-chai');
const chaiAsPromised = (...args) => import('chai-as-promised').then(({default: chaiAsPromised}) => chaiAsPromised(...args));
const { should, use } = require('chai');

should();
use(sinonChai);
use(chaiAsPromised);
