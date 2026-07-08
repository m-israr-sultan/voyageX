import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ImagesService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadImage(
    bucket: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<{ path: string; url: string }> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const extension = fileName.split('.').pop();
    const uniqueName = `${timestamp}-${random}.${extension}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(uniqueName, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error('Failed to upload image to storage');
    }

    return {
      path: uniqueName,
      url: `/api/v1/images/${bucket}/${uniqueName}`,
    };
  }

  async getImage(bucket: string, path: string): Promise<Buffer> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('Supabase download error:', error);
        throw new NotFoundException(`Image not found`);
      }

      if (!data) {
        throw new NotFoundException('Image data is empty');
      }

      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error fetching image:', error);
      throw new NotFoundException('Image not found');
    }
  }

  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        throw new NotFoundException('Could not generate signed URL');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new NotFoundException('Could not generate signed URL');
    }
  }
}