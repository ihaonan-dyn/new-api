import { makeObservable, observable, action } from 'mobx';
// 尝试默认导入
import { makePersistable,isHydrated} from 'mobx-persist-store';

/**
 * 图生视频的输入参数类型
*/
export type VideoFromImageInputs = {
    model: string;
    prompt: string;
    img_url: string;
    group: string;
}

/**
 * 文生视频的输入参数类型
*/
export type VideoFromTextInputs = {
    model: string;
    prompt: string;
    size: string;
    group: string;
}

export class GenerateTaskStore {
    // 存储文生图相关状态的对象，包含 task_id
    imageGenerationState = {
        task_id: null as number | null,
    };

    // 存储图生视频相关状态的对象，包含 task_id
    videoFromImageState = {
        task_id: null  as number | null,
    };

    // 图生视频的输入参数
    videoFromImageInputs = {
        model: 'wan2.1模型',
        prompt:'',
        img_url:'',
        group: '',
    } as VideoFromImageInputs

    // 存储文生视频相关状态的对象，包含 task_id
    videoFromTextState = {
        task_id: null  as number | null,
    };


    constructor() {
        makeObservable(this, {
            imageGenerationState: observable,
            videoFromImageState: observable,
            videoFromTextState: observable,
            setImageGenerationTaskId: action,
            setVideoFromImageTaskId: action,
            setVideoFromTextTaskId: action,
            videoFromImageInputs: observable,
            setVideoFromImageInputs: action,
        });

        makePersistable(this, {
            name: 'GenerateTaskStore',
            properties: ['imageGenerationState', 'videoFromImageState', 'videoFromTextState'],
            storage: window.localStorage
        });
    }

    // 设置文生图的 task_id
    setImageGenerationTaskId = (id:number) => {
        this.imageGenerationState.task_id = id;
    };

    // 设置图生视频的 task_id
    setVideoFromImageTaskId = (id:number) => {
        this.videoFromImageState.task_id = id;
    };

    // 设置文生视频的 task_id
    setVideoFromTextTaskId = (id:number) => {
        this.videoFromTextState.task_id = id;
    };

    // 设置图生视频的输入参数
    setVideoFromImageInputs = (inputs: Partial<VideoFromImageInputs>) => {
        this.videoFromImageInputs = {
            ...this.videoFromImageInputs,
            ...inputs,
        };
    }

}

const generateTaskStore = new GenerateTaskStore();

export default generateTaskStore;
