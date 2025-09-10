import { useHashParams } from './useHashParams';

export function useModalController(modalHahsParm: string) {
    const { deleteHashParams, setHashParams, hashParams, } = useHashParams();
    const isOpen = hashParams[modalHahsParm] === 'true'
    function onCloseModal() {
        deleteHashParams([modalHahsParm])
    }
    return { isOpen, onCloseModal }
}