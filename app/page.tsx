'use client'

import Image from 'next/image'
import styles from './page.module.css'
import { useEffect, useRef, useState } from 'react'
import autoCorrelate from './correlate'

export default function Home() {
  let noteStrings = ["C", "C\u266f", "D", "D\u266f", "E", "F", "F\u266f", "G", "G\u266f", "A", "A\u266f", "B"];  //flat: \u266D shap: \u266f

  const [load, setLoad] = useState(false);
  const pRef = useRef<HTMLParagraphElement>(null);
  const upRef = useRef<HTMLDivElement>(null);
  const downRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const highRef = useRef<HTMLDivElement>(null);
  const lowRef = useRef<HTMLDivElement>(null);
  const canvRef = useRef<HTMLCanvasElement>(null);
  let sampleRate = 0;
  let analyser: AnalyserNode;
  let dataArray: Float32Array;

  async function getMic() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
          const audioCtx = new AudioContext();
          sampleRate = audioCtx.sampleRate;
          analyser = audioCtx.createAnalyser();
          if (analyser) {
            analyser.fftSize = 8192;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
          }
        })
        .catch((err) => {
          console.error(err.name, err.message);
          alert('Fail to load audio stream.');
        });
      // const note_name = ['C', 'C+', 'D', 'D+', 'E', 'F', 'F+', 'G', 'G+', 'A', 'A+', 'B']
      // let note = 9;
      // let octave = 0;
      // for(let i=-50; i<40; i++){
      //   const hz = 440*(Math.pow(2, i/12));
      //   hz_list.push(Number(hz.toFixed(2)));
      // }
    } catch (err) {
      console.log("err", err);
    }
  }

  useEffect(() => {
    console.log("run");
    getMic().then(() => {
      setLoad(true);
      console.log("loaded");
      start();
    });
  }, []);

  function start() {
    if (analyser) {
      dataArray = new Float32Array(analyser.frequencyBinCount);
      //console.log("analyser", analyser);
      //console.log("dataArray", dataArray);
      console.log("start");
      requestAnimationFrame(callback);
    }
  }

  let graph: number[] = [];

  function callback() {
    if (analyser) {
      analyser.getFloatTimeDomainData(dataArray);
      const pitch = Number(autoCorrelate(dataArray, sampleRate).toFixed(2));                                                // Rounding to 2 Decimal Places to reduce UI Exhaust

      let isRun = false;
      let note = -1;
      let singleNoteValue = "--";
      let octave = -1;
      let targetPitch = -1;
      let [low, high] = [-1, -1]
      let accuracy = 0;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const rate = 100;

      if (pitch >= 25.96 && pitch <= 4186.01) {
        isRun = true;
        note = noteFromPitch(pitch);
        singleNoteValue = noteStrings[(note + 9) % 12];
        octave = Math.floor((note + 9) / 12);
        targetPitch = pitchFromNote(note);
        [low, high] = [pitchFromNote(note - 1), pitchFromNote(note + 1)];
        accuracy = Number(((pitch > targetPitch ? (pitch - targetPitch) / (high - targetPitch) : -1 * (targetPitch - pitch) / (targetPitch - low))).toFixed(2));
        //graph.push(accuracy);
        //if (graph.length > rate) graph.shift();
      }
      //graph.push(accuracy);
      //console.log("graph", graph);
      if (noteRef.current) {
        if (note != -1)
          noteRef.current.innerText = singleNoteValue + octave;
        else noteRef.current.innerText = "--";
      }
      if(highRef.current && lowRef.current) {
        if(note != -1){
          highRef.current.innerText = noteStrings[(note+10)%12];
          lowRef.current.innerText = noteStrings[(note+8)%12];
        } else {
          highRef.current.innerText = "--";
          lowRef.current.innerText = "--";
        }
      }
      // if (pRef.current) {
      //   pRef.current.innerText = `note_id: ${note}\noctave: ${octave}\nnote: ${singleNoteValue}\nfreq: ${pitch}hz\ntarget: ${targetPitch}hz\nnear: ${low}, ${high}\naccuracy: ${accuracy}%`;
      // }

      if (upRef.current) {
        let height = 0;
        let color = "green";
        if (accuracy > 0) {
          height = accuracy > 0.5 ? 100 : accuracy * 200;
        } else height = 0;
        if(accuracy>0.1) color = "yellow"
        if(accuracy>0.25) color = "red"
        upRef.current.style.setProperty("height", height + "%");
        upRef.current.style.setProperty("background-color", color);
      }

      if (downRef.current) {
        let height = 0;
        let color = "green";
        if (accuracy < 0) {
          height = accuracy < -0.5 ? 100 : accuracy * -200;
        } else height = 0;
        if(accuracy<-0.1) color = "yellow";
        if(accuracy<-0.25) color = "red";
        downRef.current.style.setProperty("height", height + "%");
        downRef.current.style.setProperty("background-color", color);
      }
      // if (dRef.current) {
      //   dRef.current.style.setProperty("left", width / 2 + width / 2 * accuracy + "px");
      //   // if(dRef.current.offsetLeft > 10) 
      //   graph.push(dRef.current.offsetLeft);
      //   if (graph.length > rate) graph.shift();
      //   console.log(graph)
      // }

      // if (canvRef.current) {
      //   canvRef.current.width = width;
      //   canvRef.current.height = height;
      //   const context = canvRef.current.getContext("2d");
      //   if (context) {
      //     context.clearRect(0, 0, width, height);
      //     context.beginPath();
      //     if (note == -1) context.strokeStyle = "blue";
      //     else if (Math.abs(accuracy) < 0.2) context.strokeStyle = "green";
      //     else context.strokeStyle = "red";
      //     context.lineWidth = 3;
      //     // context.moveTo(width / 2 + width / 2 * graph[graph.length - 1], height / 3);
      //     context.moveTo(graph[graph.length - 1], height / 3);
      //     for (let i = 1; i < graph.length; i++) {
      //       // context.lineTo(width / 2 + width / 2 * graph[graph.length - 1 - i], height / 3 + height * 2 / 3 / rate * i);
      //       context.lineTo(graph[graph.length - 1 - i], height / 3 + height * 2 / 3 / rate * i);
      //     }
      //     context.stroke();
      //   }
      // }
    } else console.log("analyser is null");
    requestAnimationFrame(callback);
  }

  function noteFromPitch(frequency: number) {
    let noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 48;
  }

  function pitchFromNote(note: number) {
    let pitch = 440 * Math.pow(2, (note - 48) / 12);
    return Number(pitch.toFixed(2));
  }



  return (
    <main className={styles.root}>
      {load ?
        <div className={styles.loaded}>
          <div className={styles.display}>
            <div className={styles.up}>
              <div ref={upRef} className={styles.graphup}></div>
              <div ref={highRef} className={styles.high}></div>
            </div>

            <div ref={noteRef} className={styles.note}>--</div>

            <div className={styles.down}>
              <div ref={downRef} className={styles.graphdown}></div>
              <div ref={lowRef} className={styles.low}></div>
            </div>
          </div>
          {/* {run ? <button onClick={() => { setRun(false); counter = 0; clearInterval(interval); }}>stop</button> : <button onClick={() => { setRun(true); start(); }}>start</button>} */}
          {/* <canvas ref={canvRef} style={{ width: "100vw", height: "100vh" }}></canvas> */}
          {/* <p ref={pRef} style={{ wordWrap: "break-word", width: "1200px", position: "fixed", top: "0px", left: "0px", color: "gray" }}></p> */}
          {/* <div ref={dRef} style={{ width: "50px", height: "50px", position: "absolute", "backgroundColor": "aqua", "top": "calc(100vh / 3)", "left": "50vw", borderRadius: "25px", transform: "translate(-50%, -50%)"}}></div> */}
        </div>
        : <div className={styles.loading}>loading..</div>
      }
    </main>
  )
}
