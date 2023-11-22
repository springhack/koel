interface LyricsLine {
  time: number;
  text: string;
}

export class LyricsTracker {
  static TIME_REGEXP = /\[(\d+):(\d+)(.\d+)?\]/
  static EMPTY_LINE: LyricsLine = { time: 0, text: '' }
  #lines: LyricsLine[] = [];
  setLyrics(str: string) {
    this.#lines = str
      .split('\n')
      .map((line) => {
        const match = LyricsTracker.TIME_REGEXP.exec(line);
        if (match) {
          const timeStr = match[0];
          let time = (parseInt(match[1]) * 60 + parseInt(match[2])) * 1000;
          if (match.length > 3) {
            time += parseInt(match[3].substring(1, 3)) * 10;
          }
          let text = line.replace(timeStr, '').trim();
          if (text === '') {
            text = '--------';
          }
          return {
            time, text
          }
        }
        return {
          time: -1,
          text: ''
        };
      })
      .filter(x => (x.time !== -1));
    this.#lines.sort((x, y) => {
      if (x.time === y.time) {
        let xTag = x.text.startsWith('[') ? 1 : 0;
        let yTag = y.text.startsWith('[') ? 1 : 0;
        if (xTag && yTag) {
          return 0;
        }
        return (xTag - yTag);
      }
      return x.time - y.time;
    });
  }
  getLines() {
    return this.#lines;
  }
  getLineAtTime(time: number, start = 0, end = this.#lines.length - 1): { index: number } & LyricsLine {
    if (end < 0) {
      return {
        index: 0,
        ...LyricsTracker.EMPTY_LINE
      };
    }
    if (end - start + 1 <= 3) {
      for (let i = end; i >= start; --i) {
        if (this.#lines[i].time <= time) {
          return {
            index: i,
            ...this.#lines[i]
          };
        }
      }
      if (this.#lines.length > 0) {
        const index = this.#lines.length - 1;
        return {
          index,
          ...this.#lines[this.#lines.length - 1]
        };
      }
      return {
        index: 0,
        ...LyricsTracker.EMPTY_LINE
      };
    } else {
      let middle = Math.floor((start + end) / 2);
      if (this.#lines[middle].time <= time) {
        return this.getLineAtTime(time, middle, end);
      } else {
        return this.getLineAtTime(time, start, middle);
      }
    }
  }
}