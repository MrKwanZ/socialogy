import { useState, useEffect } from 'react';

import Backdrop from '../../Backdrop/Backdrop';
import Modal from '../../Modal/Modal';
import Input from '../../Form/Input/Input';
import FilePicker from '../../Form/Input/FilePicker';
import Image from '../../Image/Image';
import { requiredRule, lengthRules } from '../../../util/validators';
import {
  validateAndTouchField,
  areFieldsValid
} from '../../../util/formValidation';
import { generateBase64FromImage } from '../../../util/image';
import type { PostFormState } from '../../../types/form';
import type { FeedPost, PostFormData } from '../../../types/graphql';

const POST_FORM: PostFormState = {
  title: {
    value: '',
    valid: false,
    touched: false,
    errorMessage: '',
    label: 'title',
    validators: [requiredRule('Title'), ...lengthRules({ min: 5 })]
  },
  image: {
    value: '',
    valid: false,
    touched: false,
    errorMessage: '',
    label: 'image',
    validators: [requiredRule('Image')]
  },
  content: {
    value: '',
    valid: false,
    touched: false,
    errorMessage: '',
    label: 'content',
    validators: [requiredRule('Content'), ...lengthRules({ min: 5 })]
  }
};

interface FeedEditProps {
  editing: boolean;
  selectedPost: FeedPost | null;
  loading?: boolean;
  onCancelEdit: () => void;
  onFinishEdit: (post: PostFormData) => void;
}

const FeedEdit = ({
  editing,
  selectedPost,
  loading,
  onCancelEdit,
  onFinishEdit
}: FeedEditProps) => {
  const [postForm, setPostForm] = useState<PostFormState>(POST_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (editing && selectedPost) {
      setPostForm({
        title: {
          ...POST_FORM.title,
          value: selectedPost.title,
          valid: true,
          errorMessage: ''
        },
        image: {
          ...POST_FORM.image,
          value: selectedPost.imagePath,
          valid: true,
          errorMessage: ''
        },
        content: {
          ...POST_FORM.content,
          value: selectedPost.content,
          valid: true,
          errorMessage: ''
        }
      });
    }
  }, [editing, selectedPost]);

  const postInputChangeHandler: (
    input: keyof PostFormState,
    value: string,
    files?: FileList | null
  ) => void = (input, value, files) => {
    if (files?.[0]) {
      generateBase64FromImage(files[0])
        .then((b64) => {
          if (typeof b64 === 'string') {
            setImagePreview(b64);
          }
        })
        .catch(() => {
          setImagePreview(null);
        });
    }

    setPostForm((prevState) => ({
      ...prevState,
      [input]: {
        ...prevState[input],
        value: files?.[0] ?? value
      }
    }));
  };

  const inputBlurHandler = (input: keyof PostFormState) => {
    setPostForm((prevState) => {
      if (input === 'title') {
        return { ...prevState, title: validateAndTouchField(prevState.title) };
      }
      if (input === 'image') {
        return { ...prevState, image: validateAndTouchField(prevState.image) };
      }
      return { ...prevState, content: validateAndTouchField(prevState.content) };
    });
  };

  const validateAllFields = (form: PostFormState) => {
    const title = validateAndTouchField(form.title);
    const image = validateAndTouchField(form.image);
    const content = validateAndTouchField(form.content);
    const validatedForm: PostFormState = { title, image, content };
    const updatedFormIsValid = areFieldsValid([title, image, content]);

    return { validatedForm, updatedFormIsValid };
  };

  const cancelPostChangeHandler = () => {
    setPostForm(POST_FORM);
    setImagePreview(null);
    onCancelEdit();
  };

  const acceptPostChangeHandler = () => {
    const { validatedForm, updatedFormIsValid } = validateAllFields(postForm);

    setPostForm(validatedForm);

    if (!updatedFormIsValid) {
      return;
    }

    const post: PostFormData = {
      title: validatedForm.title.value,
      image: validatedForm.image.value,
      content: validatedForm.content.value
    };
    onFinishEdit(post);
    setPostForm(POST_FORM);
    setImagePreview(null);
  };

  if (!editing) {
    return null;
  }

  return (
    <>
      <Backdrop open onClick={cancelPostChangeHandler} />
      <Modal
        title="New Post"
        acceptEnabled
        onCancelModal={cancelPostChangeHandler}
        onAcceptModal={acceptPostChangeHandler}
        isLoading={loading}
      >
        <form>
          <Input
            id="title"
            label="Title"
            control="input"
            onChange={(id, value, files) =>
              postInputChangeHandler(id as keyof PostFormState, value, files)
            }
            onBlur={() => inputBlurHandler('title')}
            valid={postForm.title.valid}
            touched={postForm.title.touched}
            errorMessage={postForm.title.errorMessage}
            value={postForm.title.value}
          />
          <FilePicker
            id="image"
            label="Image"
            onChange={(id, value, files) =>
              postInputChangeHandler(id as keyof PostFormState, value, files)
            }
            onBlur={() => inputBlurHandler('image')}
            valid={postForm.image.valid}
            touched={postForm.image.touched}
            errorMessage={postForm.image.errorMessage}
          />
          <div className="new-post__preview-image">
            {!imagePreview && <p>Please choose an image.</p>}
            {imagePreview && <Image imageUrl={imagePreview} contain left />}
          </div>
          <Input
            id="content"
            label="Content"
            control="textarea"
            rows={5}
            onChange={(id, value, files) =>
              postInputChangeHandler(id as keyof PostFormState, value, files)
            }
            onBlur={() => inputBlurHandler('content')}
            valid={postForm.content.valid}
            touched={postForm.content.touched}
            errorMessage={postForm.content.errorMessage}
            value={postForm.content.value}
          />
        </form>
      </Modal>
    </>
  );
};

export default FeedEdit;
