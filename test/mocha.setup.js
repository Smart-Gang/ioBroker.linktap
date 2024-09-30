// Don't silently swallow unhandled rejections
process.on('unhandledRejection', (e) => {
    throw e;
});

// enable the should interface with sinon
// and load chai-as-promised and sinon-chai by default
const sinonChai = require('sinon-chai');
import * as chaiAsPromised from "chai-as-promised";
const { should, use } = require('chai');

should();
use(sinonChai);
use((chaiAsPromised as any).default);
