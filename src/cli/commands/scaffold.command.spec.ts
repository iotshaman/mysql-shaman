import 'mocha';
import * as sinon from "sinon";
import { expect } from 'chai';
import { ScaffoldCommand } from './scaffold.command';

describe('ScaffoldCommand', () => {

  var sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('name should equal "scaffold"', () => {
    let command = new ScaffoldCommand();
    expect(command.name).to.equal("scaffold");
  });

});