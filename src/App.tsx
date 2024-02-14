import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import "./App.css";
function App() {
  const [loaded, setLoaded] = useState(false);
  const [complete, setComplete] = useState(true);
  useEffect(() => {
    const updateMessage = ({ message }: { message: string }) => {
      if (messageRef.current) {
        if (typeof messageRef.current === "string") {
          // Handle the string case
          console.log(messageRef.current);
        } else {
          // Handle the HTMLParagraphElement case
          messageRef.current.innerHTML = message;
        }
      }
    };

    // Your ffmpeg logic here

    // Simulate a log event
    updateMessage({ message: "Click start to transcode" });
  }, []);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const setMessage = () => {
    setComplete(false);
    return "Transcoding completed.";
  };
  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      console.log(message, 38);
      if (messageRef.current)
        messageRef.current.innerHTML =
          message === "Aborted()" ? setMessage() : message;
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
    setLoaded(true);
  };

  const transcode = async (file: File) => {
    await load();
    const videoURL = file;
    console.log(videoURL);
    const ffmpeg = ffmpegRef.current;
    if (file) {
      await ffmpeg.writeFile("input.avi", await fetchFile(file));
    } else {
      // Handle the case when file is null, e.g., show an error message or perform some other action.
      console.error("No file selected");
    }
    await ffmpeg.exec([
      "-i",
      "input.avi",
      "-c:v",
      "libx264", // Video codec
      "-c:a",
      "aac",
      "-s",
      "640x360",
      "output.mp4",
    ]);
    const fileData = await ffmpeg.readFile("output.mp4");
    const data = new Uint8Array(fileData as ArrayBuffer);
    if (videoRef.current) {
      const resultRef = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
      videoRef.current.src = resultRef;
    }
  };
  const download = () => {
    if (videoRef.current && file) {
      const a = document.createElement("a");
      a.href = videoRef.current?.src;
      a.download = file.name;
      a.click();
      console.log(videoRef.current.src);
    }
  };
  return (
    // loaded ? (
    <div className="App">
      <p />
      <video width={"500px"} height={"300px"} ref={videoRef} controls></video>
      <br />
      <input
        type="file"
        accept="audio/*,video/*"
        onChange={(e) => {
          const selectedFile = e.target.files && e.target.files[0];

          if (selectedFile) {
            setFile(selectedFile);
            transcode(selectedFile);
          }
        }}
      />

      <button disabled={complete} onClick={download}>
        download
      </button>
      <p ref={messageRef}></p>
    </div>
    // ) : (
    //   <button onClick={load}>Load ffmpeg-core</button>
  );
}

export default App;
