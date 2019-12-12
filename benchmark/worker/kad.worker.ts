import Kademlia, {
  KeyValueStore,
  PeerUdpMock,
  PeerUdpModule
} from "../../src/vendor/kademlia";
import {
  closeSocket,
  setUpSocket
} from "../../src/vendor/kademlia/modules/peer/udp";
import { expose, workerThreadsExposer } from "airpc";

import sha1 from "sha1";

export class KadWorker {
  private kad = new Kademlia(
    sha1(Math.random().toString()),
    {
      peerCreate: PeerUdpModule,
      kvs: new KeyValueStore()
    },
    {
      timeout: 5_000
    }
  );

  private peer?: PeerUdpMock;

  async init() {
    await setUpSocket();
  }

  async dispose() {
    await closeSocket();
  }

  async offer(targetKid: string) {
    const peer = (this.peer = PeerUdpModule(targetKid));
    const sdp = await peer.createOffer();
    return JSON.stringify(sdp);
  }

  async setOffer(targetKid: string, offer: string) {
    const peer = (this.peer = PeerUdpModule(targetKid));
    const sdp = await peer.setOffer(JSON.parse(offer));
    return JSON.stringify(sdp);
  }

  async setAnswer(answer: string) {
    await this.peer!.setAnswer(JSON.parse(answer));
  }

  kadAddPeer() {
    this.kad.add(this.peer!);
  }

  getKid() {
    return this.kad.kid;
  }

  async kadFindNode(kid: string) {
    const res = await this.kad.findNode(kid);
    return res ? true : false;
  }

  async kadStore(buffer: Buffer) {
    const res = await this.kad.store(buffer).catch(() => {});
    if (res) {
      return res.item.key;
    }
    return undefined;
  }

  async kadFindValue(key: string) {
    const res = await this.kad.findValue(key);
    return res ? new Uint8Array(res.item.value as ArrayBuffer) : undefined;
  }

  getAllMainNetPeers() {
    return this.kad.di.kTable.allKids;
  }
}

expose(new KadWorker(), workerThreadsExposer());