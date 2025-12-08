import { expect } from 'chai';
import { LINE_BREAK, MESSAGES } from '../constants.js';

describe('constants', () => {
  describe('LINE_BREAK', () => {
    it('should export newline character', () => {
      expect(LINE_BREAK).to.equal('\n');
    });

    it('should be a string', () => {
      expect(LINE_BREAK).to.be.a('string');
    });

    it('should have length of 1', () => {
      expect(LINE_BREAK.length).to.equal(1);
    });
  });

  describe('MESSAGES', () => {
    it('should be an object', () => {
      expect(MESSAGES).to.be.an('object');
    });

    it('should have INIT message type', () => {
      expect(MESSAGES.INIT).to.equal('INIT');
    });

    it('should have KILL message type', () => {
      expect(MESSAGES.KILL).to.equal('KILL');
    });

    it('should have SCROLL message type', () => {
      expect(MESSAGES.SCROLL).to.equal('SCROLL');
    });

    it('should have UPDATE message type', () => {
      expect(MESSAGES.UPDATE).to.equal('UPDATE');
    });

    it('should have SEARCH message type', () => {
      expect(MESSAGES.SEARCH).to.equal('SEARCH');
    });

    it('should have MOUSE_DOWN message type', () => {
      expect(MESSAGES.MOUSE_DOWN).to.equal('MOUSE_DOWN');
    });

    it('should have MOUSE_UP message type', () => {
      expect(MESSAGES.MOUSE_UP).to.equal('MOUSE_UP');
    });

    it('should have MOUSE_MOVE message type', () => {
      expect(MESSAGES.MOUSE_MOVE).to.equal('MOUSE_MOVE');
    });

    it('should have exactly 8 message types', () => {
      expect(Object.keys(MESSAGES).length).to.equal(8);
    });

    it('should have all message type values match their keys', () => {
      Object.keys(MESSAGES).forEach((key) => {
        expect(MESSAGES[key]).to.equal(key);
      });
    });

    it('should not have duplicate values', () => {
      const values = Object.values(MESSAGES);
      const uniqueValues = [...new Set(values)];
      expect(values.length).to.equal(uniqueValues.length);
    });
  });
});
