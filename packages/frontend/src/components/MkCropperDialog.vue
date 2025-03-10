<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="800"
	:height="500"
	:scroll="false"
	:withOkButton="true"
	@close="cancel()"
	@ok="ok()"
	@closed="$emit('closed')"
>
	<template #header>{{ i18n.ts.cropImage }}</template>
	<template #default="{ width, height }">
		<div class="mk-cropper-dialog" :style="`--vw: ${width}px; --vh: ${height}px;`">
			<Transition name="fade">
				<div v-if="loading" class="loading">
					<MkLoading/>
				</div>
			</Transition>
			<div class="container">
				<img ref="imgEl" :src="imgUrl" style="display: none;" @load="onImageLoad">
			</div>
		</div>
	</template>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import * as misskey from 'misskey-js';
import Cropper from 'cropperjs';
import tinycolor from 'tinycolor2';
import MkModalWindow from '@/components/MkModalWindow.vue';
import * as os from '@/os';
import { $i } from '@/account';
import { defaultStore } from '@/store';
import { apiUrl } from '@/config';
import { i18n } from '@/i18n';
import { getProxiedImageUrl } from '@/scripts/media-proxy';

const emit = defineEmits<{
	(ev: 'ok', cropped: misskey.entities.DriveFile): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const props = defineProps<{
	file: misskey.entities.DriveFile;
	aspectRatio: number;
	uploadFolder?: string | null;
}>();

const imgUrl = getProxiedImageUrl(props.file.url, undefined, true);
let dialogEl = $shallowRef<InstanceType<typeof MkModalWindow>>();
let imgEl = $shallowRef<HTMLImageElement>();
let cropper: Cropper | null = null;
let loading = $ref(true);

const ok = async () => {
	const promise = new Promise<misskey.entities.DriveFile>(async (res) => {
		const croppedCanvas = await cropper?.getCropperSelection()?.$toCanvas();
		croppedCanvas?.toBlob(blob => {
			if (!blob) return;
			const formData = new FormData();
			formData.append('file', blob);
			formData.append('name', `cropped_${props.file.name}`);
			formData.append('isSensitive', props.file.isSensitive ? 'true' : 'false');
			formData.append('comment', props.file.comment ?? 'null');
			formData.append('i', $i!.token);
			if (props.uploadFolder || props.uploadFolder === null) {
				formData.append('folderId', props.uploadFolder ?? 'null');
			} else if (defaultStore.state.uploadFolder) {
				formData.append('folderId', defaultStore.state.uploadFolder);
			}

			window.fetch(apiUrl + '/drive/files/create', {
				method: 'POST',
				body: formData,
			})
				.then(response => response.json())
				.then(f => {
					res(f);
				});
		});
	});

	os.promiseDialog(promise);

	const f = await promise;

	emit('ok', f);
	dialogEl!.close();
};

const cancel = () => {
	emit('cancel');
	dialogEl!.close();
};

const onImageLoad = () => {
	loading = false;

	if (cropper) {
		cropper.getCropperImage()!.$center('contain');
		cropper.getCropperSelection()!.$center();
	}
};

onMounted(() => {
	cropper = new Cropper(imgEl!, {
	});

	const computedStyle = getComputedStyle(document.documentElement);

	const selection = cropper.getCropperSelection()!;
	selection.themeColor = tinycolor(computedStyle.getPropertyValue('--accent')).toHexString();
	selection.aspectRatio = props.aspectRatio;
	selection.initialAspectRatio = props.aspectRatio;
	selection.outlined = true;

	window.setTimeout(() => {
		cropper!.getCropperImage()!.$center('contain');
		selection.$center();
	}, 100);

	// モーダルオープンアニメーションが終わったあとで再度調整
	window.setTimeout(() => {
		cropper!.getCropperImage()!.$center('contain');
		selection.$center();
	}, 500);
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s ease 0.5s;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.mk-cropper-dialog {
	display: flex;
	flex-direction: column;
	width: var(--vw);
	height: var(--vh);
	position: relative;

	> .loading {
		position: absolute;
		z-index: 10;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-backdrop-filter: var(--blur, blur(10px));
		backdrop-filter: var(--blur, blur(10px));
		background: rgba(0, 0, 0, 0.5);
	}

	> .container {
		flex: 1;
		width: 100%;
		height: 100%;

		> ::v-deep(cropper-canvas) {
			width: 100%;
			height: 100%;

			> cropper-selection > cropper-handle[action="move"] {
				background: transparent;
			}
		}
	}
}
</style>
