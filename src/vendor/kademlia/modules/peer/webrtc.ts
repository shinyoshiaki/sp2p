import { ID, Peer, RPC, RPCBase } from "./base";
import WebRTC, { Signal } from "webrtc4me";
import { decode, encode } from "@msgpack/msgpack";

import Event from "rx.mini";

const wrtc = require("wrtc");

export const PeerModule = (kid: string) => new PeerWebRTC(kid);

export default class PeerWebRTC implements Peer {
  type = "webrtc";
  peer: WebRTC = new WebRTC({ disable_stun: true, wrtc });
  onRpc = new Event<RPCBase & ID>();
  onDisconnect = new Event();
  onConnect = new Event();

  constructor(public kid: string) {
    this.peer.nodeId = kid;
    this.peer.onConnect.once(() => this.onConnect.execute(null));
    this.peer.onDisconnect.once(() => this.onDisconnect.execute(null));
    const { unSubscribe } = this.peer.onData.subscribe(
      ({ label, data, dataType }) => {
        try {
          if (label == "datachannel" && dataType === "ArrayBuffer") {
            const obj = this.parseRPC(data as ArrayBuffer);
            if (obj) this.onRpc.execute(obj);
          }
        } catch (error) {
          // console.error(error);
        }
      }
    );
    this.onDisconnect.once(unSubscribe);
  }

  parseRPC = (data: ArrayBuffer) => {
    const buffer = Buffer.from(data);
    try {
      const data: RPC = decode(buffer) as any;
      if (data.type) {
        if (data.sdp) data.sdp = JSON.parse(data.sdp as any);
        return data;
      }
    } catch (error) {
      // console.error(error, buffer);
    }
    return undefined;
  };

  rpc = (send: RPCBase & ID & { [key: string]: unknown }) => {
    if (send.sdp) send.sdp = JSON.stringify(send.sdp);
    const packet = encode(send);
    this.peer.send(packet);
  };

  eventRpc = (type: string, transactionId: string) => {
    const observer = new Event<any>();
    const { unSubscribe } = this.peer.onData.subscribe(
      ({ label, data, dataType }) => {
        if (label == "datachannel" && dataType === "ArrayBuffer") {
          const obj = this.parseRPC(data as ArrayBuffer);
          if (obj && obj.type === type) {
            if (obj.id === transactionId) {
              observer.execute(decode(data as ArrayBuffer));
              unSubscribe();
            }
          }
        }
      }
    );
    return observer;
  };

  createOffer = async () => {
    setTimeout(() => this.peer.makeOffer());
    const offer = await this.peer.onSignal.asPromise(1000).catch(() => {});
    if (!offer) return this.peer.rtc.localDescription!;
    return offer;
  };

  setOffer = async (offer: Signal, timeout = 10000) => {
    this.peer.setSdp(offer);
    const answer = await this.peer.onSignal.asPromise(timeout).catch(() => {});
    if (!answer) throw new Error("timeout");
    return answer;
  };

  setAnswer = async (answer: Signal, timeout = 10000) => {
    this.peer.setSdp(answer);
    const err = await this.peer.onConnect
      .asPromise(timeout)
      .catch(e => new Error(e));
    if (err) this.onConnect.error(err);
    return err;
  };

  disconnect = () => {
    this.peer.hangUp();
  };
}
