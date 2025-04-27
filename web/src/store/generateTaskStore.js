import { makeObservable, observable, action } from 'mobx';
// 尝试默认导入
import { makePersistable,isHydrated} from 'mobx-persist-store';

class GenerateTaskStore {
    // 存储文生图相关状态的对象，包含 task_id
    imageGenerationState = {
        task_id: null
    };

    // 存储图生视频相关状态的对象，包含 task_id
    videoFromImageState = {
        task_id: null
    };

    // 存储文生视频相关状态的对象，包含 task_id
    videoFromTextState = {
        task_id: null
    };

    constructor() {
        makeObservable(this, {
            imageGenerationState: observable,
            videoFromImageState: observable,
            videoFromTextState: observable,
            setImageGenerationTaskId: action,
            setVideoFromImageTaskId: action,
            setVideoFromTextTaskId: action
        });

        makePersistable(this, {
            name: 'GenerateTaskStore',
            properties: ['imageGenerationState', 'videoFromImageState', 'videoFromTextState'],
            storage: window.localStorage
        });
    }

    // 设置文生图的 task_id
    setImageGenerationTaskId = (id) => {
        this.imageGenerationState.task_id = id;
    };

    // 设置图生视频的 task_id
    setVideoFromImageTaskId = (id) => {
        this.videoFromImageState.task_id = id;
    };

    // 设置文生视频的 task_id
    setVideoFromTextTaskId = (id) => {
        this.videoFromTextState.task_id = id;
    };
}

const generateTaskStore = new GenerateTaskStore();

export default generateTaskStore;
