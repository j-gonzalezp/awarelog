import * as React from 'react';
import { Input } from './input'; 
import { Badge } from './badge'; 
import { cn } from '../../lib/utils'; 

interface TagsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string[]; 
  onChange: (tags: string[]) => void; 
  placeholder?: string;
}

const TagsInput = React.forwardRef<HTMLInputElement, TagsInputProps>(
  ({ value = [], onChange, placeholder, className, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState(''); 

    
    const addTag = (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !value.includes(trimmedTag)) { 
        onChange([...value, trimmedTag]); 
      }
    };

    
    const removeTag = (tagToRemove: string) => {
      onChange(value.filter(tag => tag !== tagToRemove)); 
    };

    
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
    };

    
    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault(); 
        addTag(inputValue); 
        setInputValue(''); 
      }
    };

    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        
        {value.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
            
            <button
              type="button" 
              onClick={() => removeTag(tag)}
              className="ml-1 text-xs text-secondary-foreground/80 hover:text-secondary-foreground"
            >
              × 
            </button>
          </Badge>
        ))}

        
        <Input
          ref={ref}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          
          
          className="flex-grow min-w-[150px]" 
          {...props}
        />
      </div>
    );
  }
);

TagsInput.displayName = 'TagsInput';

export { TagsInput };