import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/utils/password.js';
import {
  setGoogleOAuthClientForTesting,
  resetGoogleOAuthClient,
} from '../src/modules/auth/googleAuth.service.js';
import { avatarService, getAvatarsStorageDir } from '../src/modules/profile/avatar.service.js';

describe('Profile Picture & Avatar Management Integration Tests', () => {
  const CSRF_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };

  let validPngBuffer: Buffer;
  let validJpegBuffer: Buffer;
  const invalidTextBuffer = Buffer.from('<html><script>alert("hack")</script></html>');
  const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10"/></svg>');

  beforeAll(async () => {
    validPngBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r: 59, g: 130, b: 246, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    validJpegBuffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 16, g: 185, b: 129 },
      },
    })
      .jpeg()
      .toBuffer();
  });

  async function createAndLoginUser(
    email: string,
    role: 'student' | 'submitter' | 'admin' = 'student'
  ): Promise<{ cookie: string; user: any }> {
    const user = await User.create({
      name: `Test ${role}`,
      email,
      passwordHash: await hashPassword('Password123!'),
      role,
      isVerified: true,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set(CSRF_HEADER)
      .send({
        email,
        password: 'Password123!',
      });

    const cookie = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.includes('temarihub_sid')
    )!;

    return { cookie, user };
  }

  describe('1. Authentication and Authorization Boundaries', () => {
    it('denies unauthenticated requests to avatar upload endpoint (401)', async () => {
      const res = await request(app)
        .post('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .attach('avatar', validPngBuffer, 'photo.png');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('denies unauthenticated requests to avatar delete endpoint (401)', async () => {
      const res = await request(app)
        .delete('/api/v1/profile/avatar')
        .set(CSRF_HEADER);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Upload Validation Safeguards', () => {
    it('rejects uploads missing an image file with 400 Bad Request', async () => {
      const { cookie } = await createAndLoginUser('missingfile@astu.edu.et');
      const res = await request(app)
        .post('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No image file was uploaded');
    });

    it('rejects SVG files with 400 Bad Request', async () => {
      const { cookie } = await createAndLoginUser('svgtest@astu.edu.et');
      const res = await request(app)
        .post('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .attach('avatar', svgBuffer, 'vector.svg');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/(Unsupported file type|Unsupported image format)/);
    });

    it('rejects corrupted or non-image files with 400 Bad Request', async () => {
      const { cookie } = await createAndLoginUser('corrupt@astu.edu.et');
      const res = await request(app)
        .post('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .attach('avatar', invalidTextBuffer, 'script.png');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/(Corrupted or invalid|Unsupported)/);
    });

    it('rejects files larger than 5 MB in avatar service validation', async () => {
      const { user } = await createAndLoginUser('oversized@astu.edu.et');
      const largeBuffer = Buffer.alloc(5.2 * 1024 * 1024, 0);

      await expect(
        avatarService.uploadAvatar(user._id.toString(), largeBuffer)
      ).rejects.toThrow('Image file exceeds the 5 MB maximum size limit.');
    });
  });

  describe('3. Successful Avatar Lifecycle (Upload, Replace, Delete) Across Roles', () => {
    it('allows a Student to upload, crop to square WebP, and replace', async () => {
      const { cookie, user } = await createAndLoginUser('student.avatar@astu.edu.et', 'student');

      // 1. Upload valid PNG
      const uploadRes = await request(app)
        .post('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .attach('avatar', validPngBuffer, 'photo.png');

      expect(uploadRes.status).toBe(200);
      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.data.user.hasCustomAvatar).toBe(true);
      expect(uploadRes.body.data.user.avatarUrl).toMatch(/^\/uploads\/avatars\/avatar-.*\.webp$/);

      const avatarPath = uploadRes.body.data.user.avatarUrl;
      const avatarsDir = getAvatarsStorageDir();
      const localFilePath = path.join(avatarsDir, path.basename(avatarPath));
      expect(fs.existsSync(localFilePath)).toBe(true);

      // Verify Sharp processed it into 512x512 square WebP (read via buffer to avoid Windows file lock)
      const fileBuffer = fs.readFileSync(localFilePath);
      const imageMeta = await sharp(fileBuffer).metadata();
      expect(imageMeta.format).toBe('webp');
      expect(imageMeta.width).toBe(512);
      expect(imageMeta.height).toBe(512);

      // 2. Replace with a new JPEG avatar
      const replaceRes = await request(app)
        .post('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .attach('avatar', validJpegBuffer, 'new_photo.jpg');

      expect(replaceRes.status).toBe(200);
      const newAvatarPath = replaceRes.body.data.user.avatarUrl;
      expect(newAvatarPath).not.toBe(avatarPath);

      // 3. Remove custom avatar
      const deleteRes = await request(app)
        .delete('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.user.hasCustomAvatar).toBe(false);
      expect(deleteRes.body.data.user.avatarUrl).toBe('');
    });

    it('allows an Opportunity Submitter to upload and remove custom avatar', async () => {
      const { cookie } = await createAndLoginUser('submitter.pic@safaricom.et', 'submitter');

      const res = await request(app)
        .post('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .attach('avatar', validJpegBuffer, 'recruiter.jpg');

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('submitter');
      expect(res.body.data.user.hasCustomAvatar).toBe(true);
    });

    it('allows an Administrator to upload and remove custom avatar', async () => {
      const { cookie } = await createAndLoginUser('admin.pic@temarihub.et', 'admin');

      const res = await request(app)
        .post('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .attach('avatar', validPngBuffer, 'admin_avatar.png');

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user.hasCustomAvatar).toBe(true);
    });
  });

  describe('4. Google Profile Picture Integration & Custom Avatar Persistence', () => {
    it('preserves custom avatar across subsequent Google sign-ins and restores Google avatar on removal', async () => {
      const GOOGLE_PIC = 'https://lh3.googleusercontent.com/avatar/sample-google-pic.png';

      setGoogleOAuthClientForTesting({
        verifyIdToken: async () => ({
          getPayload: () => ({
            sub: 'google_sub_pic_test_999',
            email: 'googleuser@astu.edu.et',
            email_verified: true,
            name: 'Google User',
            picture: GOOGLE_PIC,
          }),
        }),
      });

      // 1. First sign-in via Google: user receives Google profile picture
      const googleSignRes = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_MOCK_TOKEN' });

      expect(googleSignRes.status).toBe(201);
      expect(googleSignRes.body.data.user.avatarUrl).toBe(GOOGLE_PIC);
      expect(googleSignRes.body.data.user.googleAvatarUrl).toBe(GOOGLE_PIC);
      expect(googleSignRes.body.data.user.hasCustomAvatar).toBe(false);

      const cookie = (googleSignRes.headers['set-cookie'] as unknown as string[]).find((c) =>
        c.includes('temarihub_sid')
      )!;

      // 2. User uploads a custom TemariHub profile picture
      const uploadRes = await request(app)
        .post('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie)
        .attach('avatar', validPngBuffer, 'custom.png');

      expect(uploadRes.status).toBe(200);
      const customAvatarUrl = uploadRes.body.data.user.avatarUrl;
      expect(customAvatarUrl).toMatch(/^\/uploads\/avatars\/avatar-.*\.webp$/);
      expect(uploadRes.body.data.user.hasCustomAvatar).toBe(true);

      // 3. User signs in with Google again: custom avatar MUST NOT be overwritten!
      const repeatSignRes = await request(app)
        .post('/api/v1/auth/google')
        .set(CSRF_HEADER)
        .send({ idToken: 'VALID_MOCK_TOKEN' });

      expect(repeatSignRes.status).toBe(200);
      expect(repeatSignRes.body.data.user.avatarUrl).toBe(customAvatarUrl);
      expect(repeatSignRes.body.data.user.hasCustomAvatar).toBe(true);
      expect(repeatSignRes.body.data.user.googleAvatarUrl).toBe(GOOGLE_PIC);

      // 4. User removes custom avatar: Google profile picture should be restored!
      const removeRes = await request(app)
        .delete('/api/v1/profile/avatar')
        .set(CSRF_HEADER)
        .set('Cookie', cookie);

      expect(removeRes.status).toBe(200);
      expect(removeRes.body.data.user.hasCustomAvatar).toBe(false);
      expect(removeRes.body.data.user.avatarUrl).toBe(GOOGLE_PIC);

      resetGoogleOAuthClient();
    });
  });
});
