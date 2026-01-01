import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
const FOLDER_PATH = process.env.SKIN_DISEASES_HISTORY_FOLDER_PATH || "";
const LIMPING_FOLDER_PATH =
  process.env.LIMPING_DETECTION_HISTORY_FOLDER_PATH || "";

/**
 * Check if AWS credentials are configured
 * @returns True if AWS credentials are available
 */
function hasAwsCredentials(): boolean {
  return !!(
    BUCKET_NAME &&
    process.env.NEXT_AWS_ACCESS_KEY_ID &&
    process.env.NEXT_AWS_SECRET_ACCESS_KEY
  );
}

/**
 * Check if we're running on Vercel
 * @returns True if running on Vercel
 */
function isVercel(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.NEXT_PUBLIC_VERCEL_URL
  );
}

/**
 * Save file to local public folder (fallback for local development)
 * Note: On Vercel, the filesystem is read-only, so this will fail.
 * For Vercel deployments, AWS S3 or Vercel Blob Storage should be used.
 * @param buffer - File buffer
 * @param filename - Filename
 * @param subfolder - Subfolder within uploads (e.g., 'skin-disease', 'limping')
 * @returns Public URL path
 * @throws Error if file cannot be written (e.g., on Vercel without write permissions)
 */
function saveToPublicFolder(
  buffer: Buffer,
  filename: string,
  subfolder?: string,
): string {
  // Warn if trying to write on Vercel
  if (isVercel()) {
    throw new Error(
      "Cannot write to public folder on Vercel. Please configure AWS S3 credentials or use Vercel Blob Storage. " +
        "Set NEXT_AWS_ACCESS_KEY_ID, NEXT_AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME environment variables.",
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const targetDir = subfolder ? path.join(uploadsDir, subfolder) : uploadsDir;

  // Create directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, buffer);

  // Return public URL path
  const publicPath = subfolder
    ? `/uploads/${subfolder}/${filename}`
    : `/uploads/${filename}`;
  return publicPath;
}

// Get S3 client with proper configuration
function getS3Client() {
  const region = process.env.NEXT_AWS_REGION || "ap-southeast-2";

  return new S3Client({
    region: region,
    credentials: {
      accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
    },
    // Force path style can help with region redirects
    forcePathStyle: false,
  });
}

/**
 * Upload a video buffer to S3 (or fallback to local storage)
 * @param buffer - The video file buffer
 * @param filename - The filename to use in S3
 * @param contentType - The MIME type of the video
 * @returns The S3 URL or local public URL of the uploaded video
 */
export async function uploadVideoToS3(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  // Fallback to local storage if AWS credentials are not configured
  if (!hasAwsCredentials()) {
    console.warn(
      "AWS credentials not configured. Falling back to local public folder storage.",
    );

    // On Vercel, warn that files won't persist
    if (isVercel()) {
      console.warn(
        "WARNING: Running on Vercel without AWS credentials. Files saved to public folder will not persist across deployments. Consider configuring AWS S3 or Vercel Blob Storage.",
      );
    }

    return saveToPublicFolder(buffer, filename, "limping");
  }

  // Construct the S3 key (path) for the video using limping folder path
  const s3Key = LIMPING_FOLDER_PATH
    ? `${LIMPING_FOLDER_PATH.replace(/^\/+|\/+$/g, "")}/${filename}`
    : filename;

  const s3Client = getS3Client();
  const region = process.env.NEXT_AWS_REGION || "ap-southeast-2";

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Construct and return the S3 URL
    const s3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;

    return s3Url;
  } catch (error: any) {
    // Handle PermanentRedirect error - bucket is in a different region
    if (
      error?.Code === "PermanentRedirect" ||
      error?.name === "PermanentRedirect"
    ) {
      const endpoint = error?.Endpoint || "";
      const regionMatch = endpoint.match(/\.s3\.([^.]+)\.amazonaws\.com/);
      const actualRegion = regionMatch ? regionMatch[1] : null;

      if (actualRegion && actualRegion !== region) {
        try {
          const correctS3Client = new S3Client({
            region: actualRegion,
            credentials: {
              accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
            },
            forcePathStyle: false,
          });

          const retryCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: contentType,
          });

          await correctS3Client.send(retryCommand);

          const s3Url = `https://${BUCKET_NAME}.s3.${actualRegion}.amazonaws.com/${s3Key}`;
          return s3Url;
        } catch (retryError: any) {
          // If retry also fails, fallback to local storage
          console.error(
            "Error uploading video to S3 after region retry, falling back to local storage:",
            retryError,
          );
          try {
            return saveToPublicFolder(buffer, filename, "limping");
          } catch (fallbackError) {
            console.error("Error saving to local folder:", fallbackError);
            throw new Error(
              `Failed to upload video: S3 error (${retryError?.message || retryError?.Code || "Unknown"}) and local fallback failed (${fallbackError instanceof Error ? fallbackError.message : "Unknown"})`,
            );
          }
        }
      }
    }

    // If S3 upload fails, fallback to local storage
    console.error(
      "Error uploading video to S3, falling back to local storage:",
      error,
    );

    try {
      return saveToPublicFolder(buffer, filename, "limping");
    } catch (fallbackError) {
      console.error("Error saving to local folder:", fallbackError);
      throw new Error(
        `Failed to upload video: S3 error (${error?.message || error?.Code || "Unknown"}) and local fallback failed (${fallbackError instanceof Error ? fallbackError.message : "Unknown"})`,
      );
    }
  }
}

/**
 * Upload an image buffer to S3 (or fallback to local storage)
 * @param buffer - The image file buffer
 * @param filename - The filename to use in S3
 * @param contentType - The MIME type of the image
 * @returns The S3 URL or local public URL of the uploaded image
 */
export async function uploadImageToS3(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  // Fallback to local storage if AWS credentials are not configured
  if (!hasAwsCredentials()) {
    console.warn(
      "AWS credentials not configured. Falling back to local public folder storage.",
    );

    // On Vercel, warn that files won't persist
    if (isVercel()) {
      console.warn(
        "WARNING: Running on Vercel without AWS credentials. Files saved to public folder will not persist across deployments. Consider configuring AWS S3 or Vercel Blob Storage.",
      );
    }

    return saveToPublicFolder(buffer, filename, "skin-disease");
  }

  // Construct the S3 key (path) for the image
  const s3Key = FOLDER_PATH
    ? `${FOLDER_PATH.replace(/^\/+|\/+$/g, "")}/${filename}`
    : filename;

  const s3Client = getS3Client();
  const region = process.env.NEXT_AWS_REGION || "ap-southeast-2";

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      // Note: ACL is optional. If your bucket has ACL disabled, remove this line
      // and ensure your bucket policy allows public read access if needed
      // ACL: "public-read",
    });

    await s3Client.send(command);

    // Construct and return the S3 URL
    // Use the region from env, or try to detect from the actual bucket location
    const s3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;

    return s3Url;
  } catch (error: any) {
    // If S3 upload fails, fallback to local storage
    console.error(
      "Error uploading to S3, falling back to local storage:",
      error,
    );

    try {
      return saveToPublicFolder(buffer, filename, "skin-disease");
    } catch (fallbackError) {
      console.error("Error saving to local folder:", fallbackError);
      throw new Error(
        `Failed to upload image: S3 error (${error?.message || error?.Code || "Unknown"}) and local fallback failed (${fallbackError instanceof Error ? fallbackError.message : "Unknown"})`,
      );
    }
  }
}

/**
 * Get the S3 URL for an image (useful for constructing URLs from stored keys)
 * @param s3Key - The S3 key (path) of the image
 * @returns The full S3 URL
 */
export function getS3Url(s3Key: string, region?: string): string {
  const bucketRegion =
    region || process.env.NEXT_AWS_REGION || "ap-southeast-2";
  const bucket = process.env.S3_BUCKET_NAME || "";
  return `https://${bucket}.s3.${bucketRegion}.amazonaws.com/${s3Key}`;
}

/**
 * Extract S3 key from an S3 URL
 * @param s3Url - The full S3 URL
 * @returns The S3 key (path) or null if not a valid S3 URL
 */
export function extractS3KeyFromUrl(s3Url: string): string | null {
  if (!s3Url || typeof s3Url !== "string") return null;

  // Match S3 URL pattern: https://bucket.s3.region.amazonaws.com/key
  const s3UrlPattern = /https?:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/;
  const match = s3Url.match(s3UrlPattern);

  if (match && match[3]) {
    return decodeURIComponent(match[3]);
  }

  // Also handle path-style URLs: https://s3.region.amazonaws.com/bucket/key
  const pathStylePattern =
    /https?:\/\/s3\.([^.]+)\.amazonaws\.com\/([^\/]+)\/(.+)/;
  const pathMatch = s3Url.match(pathStylePattern);

  if (pathMatch && pathMatch[3]) {
    return decodeURIComponent(pathMatch[3]);
  }

  return null;
}

/**
 * Check if a URL is an S3 URL
 * @param url - The URL to check
 * @returns True if it's an S3 URL
 */
export function isS3Url(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return url.includes(".s3.") && url.includes(".amazonaws.com");
}

/**
 * Check if a URL is a local public folder URL
 * @param url - The URL to check
 * @returns True if it's a local URL
 */
export function isLocalUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("/uploads/");
}

/**
 * Delete a file from local public folder
 * @param url - The local URL path (e.g., /uploads/skin-disease/file.jpg)
 * @returns True if successful
 */
function deleteFromLocalFolder(url: string): boolean {
  try {
    if (!isLocalUrl(url)) {
      return false;
    }

    // Remove leading slash and construct file path
    const filePath = path.join(process.cwd(), "public", url);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error deleting local file:", error);
    return false;
  }
}

/**
 * Delete an object from S3
 * @param s3Key - The S3 key (path) of the object to delete
 * @returns True if successful
 */
export async function deleteFromS3(s3Key: string): Promise<boolean> {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  if (!s3Key) {
    return false;
  }

  const s3Client = getS3Client();
  const region = process.env.NEXT_AWS_REGION || "ap-southeast-2";

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    // Handle PermanentRedirect error - bucket is in a different region
    if (
      error?.Code === "PermanentRedirect" ||
      error?.name === "PermanentRedirect"
    ) {
      const endpoint = error?.Endpoint || "";
      const regionMatch = endpoint.match(/\.s3\.([^.]+)\.amazonaws\.com/);
      const actualRegion = regionMatch ? regionMatch[1] : null;

      if (actualRegion && actualRegion !== region) {
        try {
          const correctS3Client = new S3Client({
            region: actualRegion,
            credentials: {
              accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
            },
            forcePathStyle: false,
          });

          const retryCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
          });

          await correctS3Client.send(retryCommand);
          return true;
        } catch (retryError: any) {
          console.error(
            "Error deleting from S3 after region retry:",
            retryError,
          );
          return false;
        }
      }
    }

    console.error("Error deleting from S3:", error);
    return false;
  }
}

/**
 * Delete an object from S3 by URL (or local file if it's a local URL)
 * @param url - The full S3 URL or local URL of the object to delete
 * @returns True if successful
 */
export async function deleteFromS3ByUrl(url: string): Promise<boolean> {
  // Handle local URLs
  if (isLocalUrl(url)) {
    return deleteFromLocalFolder(url);
  }

  // Handle S3 URLs
  const s3Key = extractS3KeyFromUrl(url);
  if (!s3Key) {
    console.warn(`Could not extract S3 key from URL: ${url}`);
    return false;
  }
  return deleteFromS3(s3Key);
}

/**
 * Delete multiple objects from S3
 * @param s3Keys - Array of S3 keys to delete
 * @returns Number of successfully deleted objects
 */
export async function deleteMultipleFromS3(s3Keys: string[]): Promise<number> {
  if (!s3Keys || s3Keys.length === 0) return 0;

  const deletePromises = s3Keys.map((key) => deleteFromS3(key));
  const results = await Promise.allSettled(deletePromises);

  return results.filter((r) => r.status === "fulfilled" && r.value === true)
    .length;
}

/**
 * Delete multiple objects from S3 by URLs (or local files if they're local URLs)
 * @param urls - Array of S3 URLs or local URLs to delete
 * @returns Number of successfully deleted objects
 */
export async function deleteMultipleFromS3ByUrls(
  urls: string[],
): Promise<number> {
  if (!urls || urls.length === 0) return 0;

  const deletePromises = urls.map((url) => deleteFromS3ByUrl(url));
  const results = await Promise.allSettled(deletePromises);

  return results.filter((r) => r.status === "fulfilled" && r.value === true)
    .length;
}
