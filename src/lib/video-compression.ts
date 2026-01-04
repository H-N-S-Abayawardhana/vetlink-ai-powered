/**
 * Client-side video compression utility
 * Compresses video files before upload to reduce file size
 */

export interface CompressionOptions {
  maxSizeMB?: number; // Target maximum file size in MB
  quality?: number; // Video quality (0.0 to 1.0, lower = smaller file)
  maxWidth?: number; // Maximum video width
  maxHeight?: number; // Maximum video height
  maxDuration?: number; // Maximum duration in seconds (truncate if longer)
}

/**
 * Compress a video file using browser APIs
 * @param file - The video file to compress
 * @param options - Compression options
 * @returns A Promise that resolves to a compressed File
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const {
    maxSizeMB = 50,
    quality = 0.7,
    maxWidth = 1280,
    maxHeight = 720,
    maxDuration,
  } = options;

  // If file is already small enough, return as-is
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= maxSizeMB) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Get video dimensions
      let width = video.videoWidth;
      let height = video.videoHeight;

      // Calculate aspect ratio
      const aspectRatio = width / height;

      // Resize if needed
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Get video duration
      const duration = video.duration;
      const targetDuration = maxDuration ? Math.min(duration, maxDuration) : duration;

      // Create MediaRecorder to capture compressed video
      const stream = canvas.captureStream(30); // 30 FPS
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, "") + ".webm",
          {
            type: "video/webm",
            lastModified: Date.now(),
          },
        );

        // Check if compressed file is small enough
        const compressedSizeMB = compressedFile.size / (1024 * 1024);
        if (compressedSizeMB <= maxSizeMB) {
          resolve(compressedFile);
        } else {
          // If still too large, try with lower quality
          if (quality > 0.3) {
            compressVideo(file, { ...options, quality: quality - 0.1 })
              .then(resolve)
              .catch(reject);
          } else {
            // If we can't compress enough, return the compressed version anyway
            console.warn(
              `Video compressed to ${compressedSizeMB.toFixed(2)} MB (target: ${maxSizeMB} MB)`,
            );
            resolve(compressedFile);
          }
        }
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error("MediaRecorder error: " + event));
      };

      // Start recording
      mediaRecorder.start();

      // Draw video frames to canvas
      video.currentTime = 0;
      const drawFrame = () => {
        if (video.ended || video.currentTime >= targetDuration) {
          mediaRecorder.stop();
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        requestAnimationFrame(() => {
          video.currentTime += 1 / 30; // Advance by 1 frame at 30 FPS
        });
      };

      video.onseeked = () => {
        drawFrame();
      };

      video.onended = () => {
        mediaRecorder.stop();
      };

      // Start playback
      video.currentTime = 0;
      video.play().catch((err) => {
        reject(new Error("Failed to play video: " + err));
      });
    };

    video.onerror = () => {
      reject(new Error("Failed to load video"));
    };

    // Load video
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Simple video compression using a more compatible approach
 * This version uses a simpler method that works better across browsers
 * Note: Browser-based video compression has limitations. For best results,
 * users should compress videos before uploading using external tools.
 */
export async function compressVideoSimple(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const { maxSizeMB = 50 } = options;

  // If file is already small enough, return as-is
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= maxSizeMB) {
    return file;
  }

  // Check if MediaRecorder is available
  if (typeof MediaRecorder === "undefined") {
    console.warn("MediaRecorder not available. Cannot compress video.");
    return file;
  }

  // Try to find a supported codec
  const codecs = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  let selectedCodec = "";
  for (const codec of codecs) {
    if (MediaRecorder.isTypeSupported(codec)) {
      selectedCodec = codec;
      break;
    }
  }

  if (!selectedCodec) {
    console.warn("No supported video codec found. Cannot compress video.");
    return file;
  }

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const chunks: Blob[] = [];
    let mediaRecorder: MediaRecorder | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;

    const cleanup = () => {
      if (video.src) {
        URL.revokeObjectURL(video.src);
      }
    };

    video.onloadedmetadata = () => {
      try {
        // Set up canvas for video capture
        canvas = document.createElement("canvas");
        const maxWidth = 1280;
        const maxHeight = 720;
        let width = video.videoWidth;
        let height = video.videoHeight;

        // Maintain aspect ratio while resizing
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext("2d");

        if (!ctx) {
          cleanup();
          resolve(file);
          return;
        }

        // Create stream from canvas
        const stream = canvas.captureStream(30); // 30 FPS

        // Create MediaRecorder
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedCodec,
          videoBitsPerSecond: 2000000, // 2 Mbps
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          cleanup();
          if (chunks.length === 0) {
            resolve(file);
            return;
          }

          const blob = new Blob(chunks, { type: selectedCodec.split(";")[0] });
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, "") + ".webm",
            {
              type: blob.type,
              lastModified: Date.now(),
            },
          );

          const compressedSizeMB = compressedFile.size / (1024 * 1024);
          console.log(
            `Video compressed from ${fileSizeMB.toFixed(2)} MB to ${compressedSizeMB.toFixed(2)} MB`,
          );

          // Return compressed file if it's smaller, otherwise return original
          if (compressedSizeMB < fileSizeMB && compressedSizeMB > 0) {
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          cleanup();
          resolve(file);
        };

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms

        // Draw video frames to canvas
        const drawFrame = () => {
          if (video.ended || video.paused || !ctx || !canvas) {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
            }
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        };

        video.onseeked = drawFrame;
        video.onplay = drawFrame;

        // Start playback
        video.currentTime = 0;
        video
          .play()
          .then(() => {
            drawFrame();
          })
          .catch((err) => {
            console.error("Failed to play video:", err);
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
            } else {
              cleanup();
              resolve(file);
            }
          });
      } catch (error) {
        console.error("Error setting up compression:", error);
        cleanup();
        resolve(file);
      }
    };

    video.onerror = () => {
      console.error("Failed to load video for compression");
      cleanup();
      resolve(file);
    };

    video.src = URL.createObjectURL(file);
  });
}
