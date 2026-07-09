import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      process.env.SUPABASE_URL;
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase credentials are not configured!');
      throw new Error('Supabase credentials are not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

    this.logger.log(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 30)}...`);

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  /**
   * Upload image to Supabase and return PROXY URL (not direct Supabase URL)
   * File is stored in: bucket/filename
   */
  async uploadImage(
    bucket: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<{ path: string; url: string }> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const extension = fileName.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueName = `${timestamp}-${random}.${extension}`;

    this.logger.log(`Uploading to Supabase: ${bucket}/${uniqueName}`);

    // ✅ Upload to bucket/filename (not bucket/bucket/filename)
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(uniqueName, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      this.logger.error(`Supabase upload error: ${error.message}`, error);
      throw new InternalServerErrorException(`Failed to upload image: ${error.message}`);
    }

    // ✅ Return PROXY URL (frontend will request this from Render backend)
    const proxyUrl = `/api/v1/images/${bucket}/${uniqueName}`;

    this.logger.log(`Image uploaded successfully: ${proxyUrl}`);
    return {
      path: uniqueName,
      url: proxyUrl,
    };
  }

  /**
   * Fetch image from Supabase and return as Buffer
   * Used by ImagesController to stream image back to frontend
   */
  async getImage(bucket: string, fileName: string): Promise<Buffer> {
    this.logger.log(`Downloading from Supabase: ${bucket}/${fileName}`);

    try {
      // ✅ Download from bucket/filename (matches upload path)
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(fileName);

      if (error) {
        this.logger.error(`Supabase download error for ${bucket}/${fileName}: ${error.message}`);
        throw new NotFoundException(`Image not found: ${bucket}/${fileName}`);
      }

      if (!data) {
        this.logger.error(`Supabase returned empty data for ${bucket}/${fileName}`);
        throw new NotFoundException('Image data is empty');
      }

      // ✅ Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      this.logger.log(`Image fetched successfully: ${bucket}/${fileName} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Unexpected error fetching image ${bucket}/${fileName}:`, error);
      throw new NotFoundException(`Image not found: ${bucket}/${fileName}`);
    }
  }

  /**
   * Generate signed URL for private files (admin-only use)
   */
  async getSignedUrl(
    bucket: string,
    fileName: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    this.logger.log(`Generating signed URL for ${bucket}/${fileName}`);

    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(fileName, expiresIn);

      if (error) {
        this.logger.error(`Signed URL error for ${bucket}/${fileName}: ${error.message}`);
        throw new NotFoundException('Could not generate signed URL');
      }

      if (!data?.signedUrl) {
        throw new NotFoundException('Signed URL generation returned empty result');
      }

      this.logger.log(`Signed URL generated for ${bucket}/${fileName}`);
      return data.signedUrl;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error generating signed URL for ${bucket}/${fileName}:`, error);
      throw new NotFoundException('Could not generate signed URL');
    }
  }

  /**
   * Delete file from Supabase (admin-only)
   */
  async deleteFile(bucket: string, fileName: string): Promise<boolean> {
    this.logger.log(`Deleting file: ${bucket}/${fileName}`);

    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        this.logger.error(`Delete error for ${bucket}/${fileName}: ${error.message}`);
        return false;
      }

      this.logger.log(`File deleted successfully: ${bucket}/${fileName}`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting file ${bucket}/${fileName}:`, error);
      return false;
    }
  }

  /**
   * Check if file exists in Supabase bucket
   */
  async fileExists(bucket: string, fileName: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list('', {
          search: fileName,
          limit: 1,
        });

      if (error) {
        return false;
      }

      return data?.some(file => file.name === fileName) ?? false;
    } catch {
      return false;
    }
  }
}