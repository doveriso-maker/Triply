import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../functions/triply-whatsapp-intake/index.ts',import.meta.url),'utf8');
const declarations=source.split('\n').filter(line=>/^const (QUESTIONNAIRE_VERSION|MODULES|REQUIRED|RATINGS)=|^function questionnaireReady/.test(line)).join('\n');
const {ready,fixture}=runInNewContext(stripTypeScriptTypes(declarations)+`\n({ready:questionnaireReady,fixture:{questionnaire_version:QUESTIONNAIRE_VERSION,questionnaire_complete:true,questionnaire:{...Object.fromEntries(REQUIRED.map(k=>[k,'known'])),...Object.fromEntries(RATINGS.map(k=>[k,3])),modules:Object.fromEntries(MODULES.map(k=>[k,true]))}}})`);
test('complete V9 requires valid email before production readiness',()=>{
  assert.equal(ready(fixture),false);
  assert.equal(ready({...fixture,customer_email:'person@example.com'}),true);
  for(const customer_email of ['invalid','a@b','a b@example.com'])assert.equal(ready({...fixture,customer_email}),false);
  assert.equal(ready({...fixture,questionnaire:{...fixture.questionnaire,customer_email:'person@example.com'}}),true);
});
test('email does not bypass modules or ratings',()=>{
  assert.equal(ready({...fixture,customer_email:'person@example.com',questionnaire:{...fixture.questionnaire,rate_food:6}}),false);
  assert.equal(ready({...fixture,customer_email:'person@example.com',questionnaire:{...fixture.questionnaire,modules:{...fixture.questionnaire.modules,dna:false}}}),false);
});
