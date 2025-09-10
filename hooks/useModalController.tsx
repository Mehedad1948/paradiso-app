import useSetSearchParams from './useSetSearchParams';

export function useModalController(modalHahsParm: string) {
    const { deleteHashParams, setHashParams, hashParams, } = useSetSearchParams();
    const isOpen = hashParams[modalHahsParm] === 'true'
    function onCloseModal() {
        deleteHashParams([modalHahsParm])
    }
    return { isOpen, onCloseModal }
}