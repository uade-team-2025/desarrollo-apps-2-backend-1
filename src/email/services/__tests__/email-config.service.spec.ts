import { EmailConfigService } from '../email-config.service';

describe('EmailConfigService', () => {
  let service: EmailConfigService;

  beforeEach(() => {
    service = new EmailConfigService();
  });

  describe('validateEmailConfiguration', () => {
    it('should throw error if EMAIL_USER is missing', () => {
      const originalUser = process.env.EMAIL_USER;
      const originalPass = process.env.EMAIL_PASS;

      delete process.env.EMAIL_USER;
      process.env.EMAIL_PASS = 'test-pass';

      expect(() => service.validateEmailConfiguration()).toThrow(
        'Incomplete email configuration. EMAIL_USER and EMAIL_PASS are required.',
      );

      process.env.EMAIL_USER = originalUser;
      process.env.EMAIL_PASS = originalPass;
    });

    it('should throw error if EMAIL_PASS is missing', () => {
      const originalUser = process.env.EMAIL_USER;
      const originalPass = process.env.EMAIL_PASS;

      process.env.EMAIL_USER = 'test-user';
      delete process.env.EMAIL_PASS;

      expect(() => service.validateEmailConfiguration()).toThrow(
        'Incomplete email configuration. EMAIL_USER and EMAIL_PASS are required.',
      );

      process.env.EMAIL_USER = originalUser;
      process.env.EMAIL_PASS = originalPass;
    });

    it('should not throw error if both EMAIL_USER and EMAIL_PASS are present', () => {
      const originalUser = process.env.EMAIL_USER;
      const originalPass = process.env.EMAIL_PASS;

      process.env.EMAIL_USER = 'test-user';
      process.env.EMAIL_PASS = 'test-pass';

      expect(() => service.validateEmailConfiguration()).not.toThrow();

      process.env.EMAIL_USER = originalUser;
      process.env.EMAIL_PASS = originalPass;
    });
  });

  describe('createEmailConfig', () => {
    beforeEach(() => {
      process.env.EMAIL_USER = 'test-user';
      process.env.EMAIL_PASS = 'test-pass';
    });

    afterEach(() => {
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_PORT;
    });

    it('should create email config with default values', () => {
      const config = service.createEmailConfig();

      expect(config).toEqual({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test-user',
          pass: 'test-pass',
        },
      });
    });

    it('should create email config with custom values', () => {
      process.env.EMAIL_HOST = 'smtp.custom.com';
      process.env.EMAIL_PORT = '465';

      const config = service.createEmailConfig();

      expect(config).toEqual({
        host: 'smtp.custom.com',
        port: 465,
        secure: false,
        auth: {
          user: 'test-user',
          pass: 'test-pass',
        },
      });
    });

    it('should parse EMAIL_PORT as integer', () => {
      process.env.EMAIL_PORT = '2525';

      const config = service.createEmailConfig();

      expect(config.port).toBe(2525);
      expect(typeof config.port).toBe('number');
    });
  });

  describe('getSenderEmail', () => {
    it('should return EMAIL_FROM if available', () => {
      process.env.EMAIL_FROM = 'from@example.com';
      process.env.EMAIL_USER = 'user@example.com';

      const senderEmail = service.getSenderEmail();

      expect(senderEmail).toBe('from@example.com');

      delete process.env.EMAIL_FROM;
      delete process.env.EMAIL_USER;
    });

    it('should return EMAIL_USER if EMAIL_FROM is not available', () => {
      delete process.env.EMAIL_FROM;
      process.env.EMAIL_USER = 'user@example.com';

      const senderEmail = service.getSenderEmail();

      expect(senderEmail).toBe('user@example.com');

      delete process.env.EMAIL_USER;
    });

    it('should return empty string if neither EMAIL_FROM nor EMAIL_USER is available', () => {
      delete process.env.EMAIL_FROM;
      delete process.env.EMAIL_USER;

      const senderEmail = service.getSenderEmail();

      expect(senderEmail).toBe('');
    });
  });

  describe('createTransporter', () => {
    beforeEach(() => {
      process.env.EMAIL_USER = 'test-user';
      process.env.EMAIL_PASS = 'test-pass';
    });

    afterEach(() => {
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;
      jest.clearAllMocks();
    });

    it('should create a nodemailer transporter', () => {
      const mockTransporter = {
        sendMail: jest.fn(),
        verify: jest.fn((callback) => {
          callback(null, true);
        }),
      };

      jest
        .spyOn(require('nodemailer'), 'createTransport')
        .mockReturnValue(mockTransporter);

      const transporter = service.createTransporter();

      expect(transporter).toBeDefined();
      expect(transporter).toBe(mockTransporter);
    });

    it('should call verify on the transporter', () => {
      const mockTransporter = {
        sendMail: jest.fn(),
        verify: jest.fn((callback) => {
          callback(null, true);
        }),
      };

      jest
        .spyOn(require('nodemailer'), 'createTransport')
        .mockReturnValue(mockTransporter);

      service.createTransporter();

      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle transporter verification success without throwing', () => {
      const mockTransporter = {
        sendMail: jest.fn(),
        verify: jest.fn((callback) => {
          callback(null, true);
        }),
      };

      jest
        .spyOn(require('nodemailer'), 'createTransport')
        .mockReturnValue(mockTransporter);

      expect(() => service.createTransporter()).not.toThrow();
    });
  });
});
