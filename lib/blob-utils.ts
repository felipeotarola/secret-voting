import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function uploadImage(file: File) {
  try {
    // Generate a unique filename with original extension
    const fileExt = file.name.split(".").pop()
    const fileName = `${nanoid()}.${fileExt}`

    // Upload to Vercel Blob
    const { url } = await put(fileName, file, {
      access: "public",
    })

    return { url, success: true }
  } catch (error) {
    console.error("Error uploading image:", error)
    return { url: null, success: false, error }
  }
}
