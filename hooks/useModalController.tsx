import { useHashParams } from './useHashParams';

export function useModalController(modalHahsParm: string) {
    const { deleteHashParams, setHashParams, hashParams, } = useHashParams();
    const isOpen = hashParams[modalHahsParm] === 'true'
    function onCloseModal(callback?: () => void) {
        deleteHashParams([modalHahsParm])
        if (callback) {
            callback()
        }
    }
    return { isOpen, onCloseModal }
}