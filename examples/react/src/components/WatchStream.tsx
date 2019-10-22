import React, { useContext, useRef } from "react";

import { SP2PClientContext } from "../App";
import { StreamMeta } from "../../../../src/entity/data/meta";
import { VideoCanvas } from "../atoms/VideoCanvas";
import { decode } from "@msgpack/msgpack";
import { libvpxDec } from "../domain/libvpx";
import useInput from "../hooks/useInput";

const WatchStream: React.FC = () => {
  const [url, seturl] = useInput();
  const canvasRef = useRef<any>();
  const sp2pClient = useContext(SP2PClientContext);

  const watch = async () => {
    const res = await sp2pClient.actor.user.connectSubNet(url).catch(() => {});
    if (!res) return;
    const { subNet, meta } = res;
    const { width, height } = (meta as StreamMeta).payload;
    console.log({ meta });
    const { sender, listener } = await libvpxDec({
      codec: "VP8",
      width,
      height,
      fps: 30,
      bitrate: 10000,
      packetSize: 1
    });

    subNet.findStreamMetaTarget(meta as StreamMeta, ({ type, chunk }) => {
      if (type === "chunk") {
        const { video } = decode(chunk) as {
          video: Uint8Array;
          audio: Uint8Array[];
        };
        console.log({ video });
        sender.execute(new Uint8Array(Object.values(video)).buffer);
      }
    });

    listener.subscribe(ab => {
      const ctx = canvasRef.current.getContext("2d");
      const frame = ctx.createImageData(width, height);
      frame.data.set(ab, 0);
      ctx.putImageData(frame, 0, 0);
    });
  };

  return (
    <div>
      <input value={url} onChange={seturl} />
      <button onClick={watch}>watch</button>
      <VideoCanvas
        canvasRef={canvasRef}
        style={{ width: 400, height: 400 }}
        source={{ width: 400, height: 400 }}
      />
    </div>
  );
};

export default WatchStream;