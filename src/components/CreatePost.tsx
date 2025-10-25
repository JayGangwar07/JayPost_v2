"use client";

import React, { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { ImageIcon, Loader2Icon, SendIcon, XIcon } from "lucide-react";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { createPost } from "@/actions/post.action";
import { uploadImage } from "@/actions/uploadImage";

export default function CreatePost() {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState(""); // local preview
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const fileRef = useRef<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      fileRef.current = file;
      setImagePreview(URL.createObjectURL(file));
      setShowImageUpload(true);
    }
  };

  const removeImage = () => {
    fileRef.current = null;
    setImagePreview("");
    setShowImageUpload(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !fileRef.current) return;

    setIsPosting(true);
    try {
      let uploadedUrl = "";

      // Upload image to Cloudinary if selected
      /*if (fileRef.current) {
        const uploadRes = await uploadImage(fileRef.current);
        if (!uploadRes.success) throw new Error("Image upload failed");
        uploadedUrl = uploadRes.url;
      }*/
      
      if (fileRef.current) {
  const uploadRes = await uploadImage(fileRef.current);
  if (!uploadRes.success) throw new Error("Image upload failed");
  uploadedUrl = uploadRes.url;
}


      const postRes = await createPost(content, uploadedUrl);
      if (postRes.success) {
        setContent("");
        removeImage();
        toast.success("Post Created Successfully!");
      } else {
        throw new Error("Post creation failed");
      }
    } catch (err) {
      toast.error("Post Creation Failed");
      console.error("CreatePost error:", err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.imageUrl} />
            </Avatar>
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
            />
          </div>

          {imagePreview && (
            <div className="relative border rounded-lg p-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-60 w-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          )}

          {showImageUpload && !imagePreview && (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isPosting}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 
                         file:rounded-full file:border-0 file:text-sm file:font-semibold 
                         file:bg-primary file:text-white hover:file:bg-primary/90"
            />
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary flex items-center"
              onClick={() => setShowImageUpload(!showImageUpload)}
              disabled={isPosting}
            >
              <ImageIcon className="size-4 mr-2" />
              Photo
            </Button>

            <Button
              className="flex items-center"
              onClick={handleSubmit}
              disabled={(!content.trim() && !fileRef.current) || isPosting}
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
