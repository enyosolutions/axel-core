<template>
  <div class="input-group">
    <editor
      api-key="no-api-key"
      :props="fieldOptions"
      v-model="value"
      :init="{
        height: 500,
        width: '100%',
        menubar: false,
        images_upload_url: `${
          config.apiUrl || 'http://localhost:1335'
        }api/media/upload`,
        color_map: [
          '#47776e',
          'Primary Green',
          '#656278',
          'Brown',
          '#F9EEE5',
          'Beige',
          '#ECCAFA',
          'Light Purple',
          '#C2E0F4',
          'Light Blue',

          '#2DC26B',
          'Green',
          '#F1C40F',
          'Yellow',
          '#E03E2D',
          'Red',
          '#B96AD9',
          'Purple',
          '#3598DB',
          'Blue',
          '#169179',

          '#000000',
          'Black',
          '#ffffff',
          'White',
        ],

        plugins: [
          'code',
          'textcolor colorpicker',
          'advlist autolink lists link image charmap preview anchor',
          'media table',
          'image',
          'textpattern',
        ],
        toolbar:
          'bold italic underline | formatgroup | paragraphgroup | insertgroup',
        toolbar_location: 'bottom',
        skin: 'outside',
        default_link_target: '_blank',
        textpattern_patterns: [
          { start: '*', end: '*', format: 'italic' },
          { start: '**', end: '**', format: 'bold' },
          { start: '#', format: 'h1' },
          { start: '##', format: 'h2' },
          { start: '###', format: 'h3' },
          { start: '####', format: 'h4' },
          { start: '#####', format: 'h5' },
          { start: '######', format: 'h6' },
          // The following text patterns require the `lists` plugin
          { start: '1. ', cmd: 'InsertOrderedList' },
          { start: '* ', cmd: 'InsertUnorderedList' },
          { start: '- ', cmd: 'InsertUnorderedList' },
          { start: '---', replacement: '<hr/>' },
          { start: '--', replacement: '—' },
        ],
        toolbar_groups: {
          formatgroup: {
            icon: 'format',
            tooltip: 'Formatting',
            items:
              'strikethrough | formatselect fontsizeselect | forecolor backcolor | removeformat | code',
          },
          paragraphgroup: {
            icon: 'paragraph',
            tooltip: 'Paragraph format',
            items:
              'h1 h2 h3 | bullist numlist | alignleft aligncenter alignright alignjustify | indent outdent',
          },
          insertgroup: {
            icon: 'plus',
            tooltip: 'Insert',
            items: 'image media link',
          },
        },
        ...fieldOptions,
      }"
    />
  </div>
</template>

<script>
import { abstractField } from 'vue-aw-components';
import 'tinymce/tinymce';
import 'tinymce/themes/silver';
import 'tinymce/plugins/code';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';

import 'tinymce/plugins/lists';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/preview';
import 'tinymce/icons/default/';

import Editor from '@tinymce/tinymce-vue';
import config from '../../config';

//     'undo redo | formatselect fontsizeselect bold italic underline | forecolor colorpicker backcolor | \
//           alignleft aligncenter alignright alignjustify | \
//           bullist numlist outdent indent | image media link | removeformat code',
export default {
  mixins: [abstractField],
  components: { editor: Editor },
  computed: {
    fieldOptions() {
      return this.schema && this.schema.fieldOptions
        ? this.schema.fieldOptions
        : {};
    },
  },
  data() {
    return {
      config,
    };
  },
};
</script>

<style>
.vue-form-generator .field-wrap .tox-editor-header button,
.vue-form-generator .field-wrap .tox-editor-header input[type='submit'] {
  border-radius: 0;
  border: initial;
  display: inherit;
  padding: initial;
}
</style>
