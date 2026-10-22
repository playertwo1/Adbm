const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const rootHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const androidHtml = fs.readFileSync(path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'index.html'), 'utf8');
assert.equal(rootHtml, androidHtml, 'HTML raiz e Android devem permanecer byte-idênticos');

const functionStart = rootHtml.indexOf('        function openFloatingWorkoutSettings(');
assert(functionStart >= 0, 'openFloatingWorkoutSettings deve existir');
let depth = 0;
let opened = false;
let functionEnd = -1;
for (let index = rootHtml.indexOf('{', functionStart); index < rootHtml.length; index++) {
    if (rootHtml[index] === '{') { depth++; opened = true; }
    if (rootHtml[index] === '}' && opened && --depth === 0) {
        functionEnd = index + 1;
        break;
    }
}
assert(functionEnd > functionStart, 'openFloatingWorkoutSettings deve estar completa');

const ancestor = { id: 'tab-perfil' };
const modal = {
    parentNode: ancestor,
    classes: new Set(['hidden']),
    classList: {
        remove(name) { modal.classes.delete(name); },
        add(name) { modal.classes.add(name); }
    }
};
const accessibilityModal = {
    parentNode: ancestor,
    classes: new Set(['hidden']),
    classList: {
        remove(name) { accessibilityModal.classes.delete(name); },
        add(name) { accessibilityModal.classes.add(name); }
    }
};
const body = {
    appendChild(node) {
        node.parentNode = this;
    }
};
const context = vm.createContext({
    document: {
        body,
        getElementById(id) {
            return {
                floatingWorkoutSettingsModal: modal,
                accessibilitySettingsModal: accessibilityModal
            }[id] || null;
        }
    },
    applyFloatingWorkoutPreferences() {},
    applyAccessibilityPreferences() {}
});
vm.runInContext(rootHtml.slice(functionStart, functionEnd), context);
context.openFloatingWorkoutSettings();

assert.equal(modal.parentNode, body, 'modal deve ser movido para document.body antes de abrir fora da aba transformada');
assert.equal(modal.classes.has('hidden'), false, 'modal deve ficar visível após abrir');
console.log('PASS: modal do modo flutuante ocupa a viewport fora da aba Perfil transformada');

const accessibilityStart = rootHtml.indexOf('        function openAccessibilitySettings(');
assert(accessibilityStart >= 0, 'openAccessibilitySettings deve existir');
const accessibilityBodyStart = rootHtml.indexOf('{', accessibilityStart);
depth = 0;
opened = false;
functionEnd = -1;
for (let index = accessibilityBodyStart; index < rootHtml.length; index++) {
    if (rootHtml[index] === '{') { depth++; opened = true; }
    if (rootHtml[index] === '}' && opened && --depth === 0) {
        functionEnd = index + 1;
        break;
    }
}
assert(functionEnd > accessibilityStart, 'openAccessibilitySettings deve estar completa');
vm.runInContext(rootHtml.slice(accessibilityStart, functionEnd), context);
context.openAccessibilitySettings();
assert.equal(accessibilityModal.parentNode, body, 'modal de acessibilidade deve sair da aba Perfil transformada antes de abrir');
assert.equal(accessibilityModal.classes.has('hidden'), false, 'modal de acessibilidade deve ficar visível após abrir');
console.log('PASS: modal de acessibilidade ocupa a viewport fora da aba Perfil transformada');
