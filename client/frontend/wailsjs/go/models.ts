export namespace main {
	
	export class ExportOptions {
	    inputPath: string;
	    outputPath: string;
	    startTime: number;
	    endTime: number;
	    volume: number;
	
	    static createFrom(source: any = {}) {
	        return new ExportOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.inputPath = source["inputPath"];
	        this.outputPath = source["outputPath"];
	        this.startTime = source["startTime"];
	        this.endTime = source["endTime"];
	        this.volume = source["volume"];
	    }
	}
	export class VideoInfo {
	    duration: number;
	    width: number;
	    height: number;
	
	    static createFrom(source: any = {}) {
	        return new VideoInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.duration = source["duration"];
	        this.width = source["width"];
	        this.height = source["height"];
	    }
	}

}

