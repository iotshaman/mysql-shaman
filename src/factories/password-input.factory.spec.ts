import 'mocha';
import * as sinon from 'sinon';
import * as readline from 'readline';
import { expect } from 'chai';
import { PasswordInputFactory } from './password-input.factory';

describe('Password Input Factory', () => {

  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('PasswordInputFactory should return cli interface instance', () => {
    sandbox.stub(readline, 'createInterface').returns(<any>{});
    let subject = PasswordInputFactory();
    expect(subject).not.to.be.null;
  })

})